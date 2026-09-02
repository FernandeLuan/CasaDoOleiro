import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import vm from 'node:vm';

test('activity cards promote the title and never render an exact activity time', async () => {
  const planning = fs.readFileSync('js/portal/planejamento.js', 'utf8');
  const home = fs.readFileSync('js/portal/home.js', 'utf8');

  expect(planning).toContain('<h4 data-no-i18n>${escapeHtml(s.activity.name');
  expect(planning).not.toContain("escapeHtml(s.activity.time||'N/A')");
  expect(planning).not.toContain('id="actTime"');

  expect(home).toContain('<h3 data-no-i18n>${escapeHtml(s.activity.name');
  expect(home).not.toContain('time-box single');
  expect(home).not.toContain("escapeHtml(s.activity.time||'N/A')");
});

test('period compatibility derives legacy values and new writes do not force time', async () => {
  const source = fs.readFileSync('js/shared/utils.js', 'utf8');
  const context=vm.createContext({state:{sessions:[],activities:[]},currentLocale:()=> 'pt-BR',Intl,Date});
  vm.runInContext(source,context);

  expect(context.activityPeriodValue({time:'09:00'})).toBe('Manhã');
  expect(context.activityPeriodValue({time:'15:15'})).toBe('Tarde');
  expect(context.activityPeriodValue({time:'20:10'})).toBe('Noite');
  expect(context.activityPeriodValue({})).toBe('Sem preferência');
  expect([{name:'Zulu',period:'Noite'},{name:'Alfa',period:'Manhã'}].sort(context.activityScheduleCompare).map(row=>row.name)).toEqual(['Alfa','Zulu']);

  const planning=fs.readFileSync('js/services/planning-service.js','utf8');
  const series=fs.readFileSync('js/services/planning-series-service.js','utf8');
  expect(planning).not.toContain("time:data.time||''");
  expect(planning).toContain("timeFields=legacyTime?{time:legacyTime}:{}");
  expect(series).toContain("...(item.time?{time:item.time}:{})");
});

test('admin review derives period changes from legacy time-only proposals', async () => {
  const context=vm.createContext({
    state:{sessions:[],activities:[]},currentLocale:()=> 'pt-BR',Intl,Date,
    document:{addEventListener(){}},fmtDate:value=>String(value),escapeHtml:value=>String(value),
  });
  context.window=context;
  vm.runInContext(fs.readFileSync('js/shared/utils.js','utf8'),context);
  vm.runInContext(fs.readFileSync('js/admin/review-signals-r31.js','utf8'),context);

  const diff=context.OleiroR31AdminReview.summarizeDiff(
    {date:'2026-09-22',time:'09:00',duration:60,activityName:'Atividade legado'},
    {time:'15:00'},
  );
  expect(diff.from).toContain('Período Manhã');
  expect(diff.to).toContain('Período Tarde');
});
