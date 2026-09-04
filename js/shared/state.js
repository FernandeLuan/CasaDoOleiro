/* Estado efêmero da interface. Dados persistentes vêm exclusivamente do Firebase. */
const _oleiroNow = new Date();
const _oleiroToday = `${_oleiroNow.getFullYear()}-${String(_oleiroNow.getMonth()+1).padStart(2,'0')}-${String(_oleiroNow.getDate()).padStart(2,'0')}`;

const state = {
  role: null,
  currentSession: null,
  currentApplication: null,
  managerPage: 'home',
  volunteerPage: 'home',
  volunteerMode: 'candidate',
  volunteerPlanStatus: 'draft',
  candidateTab: 'candidates',
  candidateFilter: 'all',
  candidateSearch: '',
  candidateUnit: 'all',
  candidateVisibleCount: 10,
  selectedDate: _oleiroToday,
  agendaAnchor: _oleiroToday,
  personModalTab: 'overview',
  occupancyMonthAnchor: null,
  theme: localStorage.getItem('oleiro-theme') || 'light',
  units: [],
  candidates: [],
  groups: [],
  activities: [],
  sessions: [],
  sessionStatus: {},
  sessionGroups: {},
  notifications: []
};

window.state=state;
document.documentElement.classList.toggle('dark', state.theme === 'dark');
