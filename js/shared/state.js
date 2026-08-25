/* Estado de interface. Dados reais serão hidratados pelo backend.
   Dados de demonstração vivem em mock-data.js e só são aplicados com ?dev=1. */
const _oleiroNow = new Date();
const _oleiroToday = `${_oleiroNow.getFullYear()}-${String(_oleiroNow.getMonth()+1).padStart(2,'0')}-${String(_oleiroNow.getDate()).padStart(2,'0')}`;

const state = {
  role: null,
  managerPage: 'home',
  volunteerPage: 'home',
  volunteerMode: 'candidate',
  volunteerPlanStatus: 'draft',
  candidateTab: 'candidates',
  candidateFilter: 'approved',
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
  sessionStatus: {},
  sessionGroups: {},
  notifications: []
};

window.state=state;
document.documentElement.classList.toggle('dark', state.theme === 'dark');
