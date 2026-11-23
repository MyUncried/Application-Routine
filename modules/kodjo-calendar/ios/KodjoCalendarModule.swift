import ExpoModulesCore
import UIKit

/**
 * D-563 (recette du Programme du 23/11/2026) — calendrier natif d'iOS (`UICalendarView`) pour choisir la période d'un programme,
 * sans réimplémentation. La logique de sélection en deux appuis (sélection puis confirmation, début puis fin) est tenue par
 * JavaScript (`modules/kodjo-calendar/rangeSelection.ts`) ; la vue native :
 * - affiche une seule date sélectionnée (`selectedDate`) ;
 * - signale chaque appui sur une date (`onPressDate`), y compris un second appui sur la date déjà sélectionnée ;
 * - marque chaque jour de la période (`periodStart` … `periodEnd`) d'une décoration native sous son numéro.
 *
 * [Choix technique, à valider : la sélection native est `UICalendarSelectionMultiDate` limitée à une date. Un second appui sur
 * la date sélectionnée la désélectionne et iOS le signale (`didDeselectDate`) : c'est l'appui de confirmation ; la date est
 * aussitôt resélectionnée. Avec `UICalendarSelectionSingleDate`, un second appui sur la même date n'est pas signalé de façon
 * documentée.]
 */
public final class KodjoCalendarModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KodjoCalendar")

    View(KodjoCalendarView.self) {
      Events("onPressDate")

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

  private let gregorian: Calendar = {
    var calendar = Calendar(identifier: .gregorian)
    calendar.locale = Locale(identifier: "fr_FR")
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
    calendarView.locale = Locale(identifier: "fr_FR")
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

  func multiDateSelection(_ selection: UICalendarSelectionMultiDate, didSelectDate dateComponents: DateComponents) {
    let pressed = normalized(dateComponents)
    // Une seule date affichée : JavaScript décide de la nouvelle sélection ; d'ici là, la date touchée remplace l'ancienne.
    selected = pressed
    applySelection()
    emit(pressed)
  }

  func multiDateSelection(_ selection: UICalendarSelectionMultiDate, didDeselectDate dateComponents: DateComponents) {
    // Second appui sur la date sélectionnée : appui de confirmation ; la date reste affichée sélectionnée.
    let pressed = normalized(dateComponents)
    selected = pressed
    applySelection()
    emit(pressed)
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

  private func days(from start: String?, to end: String?) -> [DateComponents] {
    guard let start = start.flatMap(components(from:)), let end = end.flatMap(components(from:)),
          let first = gregorian.date(from: start), let last = gregorian.date(from: end), first <= last else { return [] }
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
