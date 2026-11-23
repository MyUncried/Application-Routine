import ExpoModulesCore
import UIKit

/**
 * D-563 (recette du Programme du 23/11/2026) — calendrier natif d'iOS (`UICalendarView`) pour choisir la période d'un programme,
 * sans réimplémentation. La logique de sélection en deux appuis (sélection puis confirmation, début puis fin) est tenue par
 * JavaScript (`src/features/programs/periodSelection.ts`) ; la vue native :
 * - affiche une seule date sélectionnée (`selectedDate`) ;
 * - signale chaque appui sur une date (`onPressDate`), y compris un second appui sur la date déjà sélectionnée ;
 * - marque chaque jour de la période (`periodStart` … `periodEnd`) d'une décoration native sous son numéro ; début confirmé
 *   sans fin : le début seul est marqué.
 *
 * [Choix technique, à valider : la sélection native est `UICalendarSelectionMultiDate` limitée à une date. Un second appui sur
 * la date sélectionnée la désélectionne et iOS le signale (`didDeselectDate`) : c'est l'appui de confirmation ; la date est
 * resélectionnée. Avec `UICalendarSelectionSingleDate`, un second appui sur la même date n'est pas signalé de façon
 * documentée.]
 *
 * Contre-recette du 23/11/2026 (c1, c2) :
 * - langue : la vue reçoit `fr_FR` par sa propriété `locale` (distincte de `calendar.locale`), réaffirmée à l'affichage ;
 * - second appui : la resélection est refaite au tour suivant de la boucle principale, iOS pouvant terminer sa propre mise à
 *   jour de la sélection après l'appel au délégué ;
 * - début confirmé sans fin : marqué d'une décoration (avant, rien ne distinguait un début confirmé).
 */
public final class KodjoCalendarModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KodjoCalendar")

    View(KodjoCalendarView.self) {
      Events("onPressDate", "onMeasure")

      Prop("selectedDate") { (view: KodjoCalendarView, value: String?) in
        view.setSelectedDate(value)
      }
      Prop("periodStart") { (view: KodjoCalendarView, value: String?) in
        view.setPeriod(start: value, end: view.periodEndValue)
      }
      Prop("periodEnd") { (view: KodjoCalendarView, value: String?) in
        view.setPeriod(start: view.periodStartValue, end: value)
      }
      Prop("visibleDate") { (view: KodjoCalendarView, value: String?) in
        view.setVisibleDate(value)
      }
      Prop("tintColor") { (view: KodjoCalendarView, value: UIColor?) in
        view.setTint(value)
      }
    }
  }
}

final class KodjoCalendarView: ExpoView, UICalendarViewDelegate, UICalendarSelectionMultiDateDelegate {
  let onPressDate = EventDispatcher()
  let onMeasure = EventDispatcher()
  private var measuredHeight: CGFloat = 0

  private static let french = Locale(identifier: "fr_FR")

  private let gregorian: Calendar = {
    var calendar = Calendar(identifier: .gregorian)
    calendar.locale = KodjoCalendarView.french
    calendar.firstWeekday = 2
    calendar.timeZone = TimeZone.current
    return calendar
  }()
  private let calendarView = UICalendarView()
  private var selection: UICalendarSelectionMultiDate?
  private var selected: DateComponents?
  private var decorationColor: UIColor = .systemBlue
  private(set) var periodStartValue: String?
  private(set) var periodEndValue: String?
  private var periodDays: [DateComponents] = []
  private var periodSet: Set<DateComponents> = []
  private var visibleSet = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    calendarView.calendar = gregorian
    applyLocale()
    calendarView.fontDesign = .default
    calendarView.delegate = self
    let multi = UICalendarSelectionMultiDate(delegate: self)
    selection = multi
    calendarView.selectionBehavior = multi
    calendarView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(calendarView)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    calendarView.frame = bounds
    reportHeight()
  }

  /// Recette du 23/11/2026 (« Est ce que le calendrier peut être plus petit ») : la hauteur n’est plus fixée par JavaScript.
  /// La vue native calcule la hauteur qu’il lui faut pour la largeur reçue (aucun rang ni repère coupé) et la signale.
  private func reportHeight() {
    guard bounds.width > 0 else { return }
    let fitting = calendarView.systemLayoutSizeFitting(
      CGSize(width: bounds.width, height: UIView.layoutFittingCompressedSize.height),
      withHorizontalFittingPriority: .required,
      verticalFittingPriority: .fittingSizeLevel
    )
    let height = ceil(fitting.height)
    guard height > 0, abs(height - measuredHeight) >= 1 else { return }
    measuredHeight = height
    onMeasure(["height": height])
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    applyLocale()
  }

  /// Langue du calendrier : la propriété `locale` de `UICalendarView` (en-tête du mois, jours de la semaine), indépendante de la
  /// langue de l'application, posée après `calendar`.
  private func applyLocale() {
    if calendarView.locale != KodjoCalendarView.french {
      calendarView.locale = KodjoCalendarView.french
    }
  }

  // MARK: Propriétés

  func setSelectedDate(_ value: String?) {
    selected = value.flatMap(components(from:))
    applySelection()
  }

  func setPeriod(start: String?, end: String?) {
    periodStartValue = start
    periodEndValue = end
    let previous = periodDays
    periodDays = days(from: start, to: end)
    periodSet = Set(periodDays)
    let changed = (previous + periodDays).map(withCalendar)
    if !changed.isEmpty {
      calendarView.reloadDecorations(forDateComponents: changed, animated: false)
    }
  }

  func setVisibleDate(_ value: String?) {
    // Mois affiché à l'ouverture seulement : l'utilisateur garde la main sur la navigation ensuite.
    guard !visibleSet, let value = value, let date = components(from: value) else { return }
    visibleSet = true
    calendarView.setVisibleDateComponents(DateComponents(calendar: gregorian, year: date.year, month: date.month, day: date.day), animated: false)
  }

  func setTint(_ value: UIColor?) {
    decorationColor = value ?? .systemBlue
    calendarView.tintColor = value
    if !periodDays.isEmpty {
      calendarView.reloadDecorations(forDateComponents: periodDays.map(withCalendar), animated: false)
    }
  }

  // MARK: Sélection

  private func applySelection() {
    guard let selection = selection else { return }
    let wanted = selected.map { [$0] } ?? []
    let current = selection.selectedDates.map(normalized)
    if current != wanted {
      selection.setSelectedDates(wanted.map(withCalendar), animated: false)
    }
  }

  /// Sélection voulue appliquée tout de suite, puis de nouveau au tour suivant de la boucle principale : iOS peut finir sa
  /// propre mise à jour (ajout ou retrait de la date touchée) après l'appel au délégué. La valeur appliquée est toujours la
  /// dernière connue (`selected`), y compris si JavaScript l'a changée entre-temps.
  private func reassertSelection() {
    applySelection()
    DispatchQueue.main.async { [weak self] in
      self?.applySelection()
    }
  }

  func multiDateSelection(_ selection: UICalendarSelectionMultiDate, canDeselectDate dateComponents: DateComponents) -> Bool {
    // Le second appui sur la date sélectionnée doit être signalé (`didDeselectDate`) : c'est l'appui de confirmation.
    true
  }

  func multiDateSelection(_ selection: UICalendarSelectionMultiDate, didSelectDate dateComponents: DateComponents) {
    let pressed = normalized(dateComponents)
    // Une seule date affichée : JavaScript décide de la nouvelle sélection ; d'ici là, la date touchée remplace l'ancienne.
    selected = pressed
    emit(pressed)
    reassertSelection()
  }

  func multiDateSelection(_ selection: UICalendarSelectionMultiDate, didDeselectDate dateComponents: DateComponents) {
    // Second appui sur la date sélectionnée : appui de confirmation ; la date reste affichée sélectionnée jusqu'à la réponse
    // de JavaScript (début confirmé : sélection de la fin ; fin confirmée : fermeture).
    let pressed = normalized(dateComponents)
    selected = pressed
    emit(pressed)
    reassertSelection()
  }

  private func emit(_ date: DateComponents) {
    guard let year = date.year, let month = date.month, let day = date.day else { return }
    onPressDate(["date": String(format: "%04d-%02d-%02d", year, month, day)])
  }

  // MARK: Décorations de la période

  func calendarView(_ calendarView: UICalendarView, decorationFor dateComponents: DateComponents) -> UICalendarView.Decoration? {
    let day = normalized(dateComponents)
    return periodSet.contains(day) ? .default(color: decorationColor, size: .small) : nil
  }

  // MARK: Dates

  private func normalized(_ value: DateComponents) -> DateComponents {
    DateComponents(year: value.year, month: value.month, day: value.day)
  }

  private func withCalendar(_ value: DateComponents) -> DateComponents {
    DateComponents(calendar: gregorian, year: value.year, month: value.month, day: value.day)
  }

  private func components(from value: String) -> DateComponents? {
    let parts = value.split(separator: "-").compactMap { Int($0) }
    guard parts.count == 3 else { return nil }
    return DateComponents(year: parts[0], month: parts[1], day: parts[2])
  }

  /// Jours marqués : du début à la fin ; sans fin (ou fin antérieure), le début seul.
  private func days(from start: String?, to end: String?) -> [DateComponents] {
    guard let start = start.flatMap(components(from:)), let first = gregorian.date(from: start) else { return [] }
    var last = first
    if let end = end.flatMap(components(from:)), let date = gregorian.date(from: end), date >= first {
      last = date
    }
    var result: [DateComponents] = []
    var cursor = first
    // Garde-fou : une période de programme ne dépasse pas quelques années.
    while cursor <= last && result.count < 3660 {
      result.append(normalized(gregorian.dateComponents([.year, .month, .day], from: cursor)))
      guard let next = gregorian.date(byAdding: .day, value: 1, to: cursor) else { break }
      cursor = next
    }
    return result
  }
}
