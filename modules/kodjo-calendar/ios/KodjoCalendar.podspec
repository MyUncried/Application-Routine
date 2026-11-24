Pod::Spec.new do |s|
  s.name           = 'KodjoCalendar'
  s.version        = '1.0.0'
  s.summary        = 'Calendrier natif iOS (UICalendarView) pour la période d’un programme (D-563).'
  s.description    = 'Module Expo local : UICalendarView, sélection en deux appuis pilotée par JavaScript, décorations natives de la période.'
  s.author         = 'KODJO'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.license        = { :type => 'UNLICENSED' }
  # Même cible minimale que @expo/ui (16.4) ; UICalendarView existe depuis iOS 16.
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
