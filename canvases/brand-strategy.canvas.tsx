import {
  Stack, Grid, H1, H2, H3, Row, Divider, Text, Table,
  Card, CardHeader, CardBody, Callout, Pill, Stat,
  TodoListCard, useCanvasState
} from 'cursor/canvas';
import type { TodoItem } from 'cursor/canvas';

// === DATA ===

const horizons: string[][] = [
  ['Мес. 1–3', 'Запуск', 'Сайт, питч в 25 СМИ, базовый контент, первая лекция', '3–5 СМИ, 1 корп. лекция, 500+ TG', '50–80к'],
  ['Мес. 4–6', 'Рост', 'Медийность в B2B-лиды, YouTube на ритме', '1000 TG, 5к IG, 2 B2B-проекта', '100–150к'],
  ['Мес. 7–12', 'Масштаб', 'Системный B2B, федеральная пресса', '10к IG, 3к TG, Forbes / Vogue', '150–200к'],
  ['Год 2–3', 'Платформа', 'Курс, книга, мероприятия', 'Курс запущен, 1 событие', '300к+'],
];

const pricing: string[][] = [
  ['Разбор гардероба', '13 000 ₽ / 2,5 ч', '10 000 – 15 000 ₽ / 1,5 ч (+ артефакт до 18–22к)'],
  ['Шопинг', '20–30 000 ₽', '30 000 – 35 000 ₽ / 2,5–3 ч + прешопинг'],
  ['Публичная лекция', '8–10 000 ₽', '30 000 – 40 000 ₽ (лиды B2C)'],
  ['Корп. лекция / мастер-класс 90 мин', '—', '50 000 – 70 000 ₽ (вход, набор кейсов)'],
  ['Корп. лекция (после кейсов / СМИ)', '—', '120 000 – 250 000 ₽'],
  ['Программа топ-команды (мес.)', '—', 'от 350 000 ₽'],
];

/** Логика B2B от фактического B2C-часа (~6,5–10к/ч разбор, ~10–12к/ч шопинг с прешопингом). */
const b2bPricingLogic: string[][] = [
  ['Публичная лекция 1–1,5 ч', '30–40к', 'Женские клубы: скидка за поток личных лидов'],
  ['Корп. лекция 90 мин', '50–70к', '~7 ч цикла (бриф, слайды, дорога, сцена) — не ниже эквивалента шопинга'],
  ['Та же лекция «со статусом»', '120–250к', 'После отзывов HR и публикаций — поднять без смены продукта'],
  ['Программа топ-команды', 'от 350к', 'Лекция + 3–5 разборов + PDF каждому + закрытие'],
];

/** Канал TG + склейка имён (из чата). */
const nameArchitecture: string[][] = [
  ['Договор, счёт, КП, HR', 'Ирина Осипова', 'Деловой контур'],
  ['Сайт, SEO, пресса', 'Ирина Осипова + фраза про Мейру в «Обо мне»', 'Доверие B2B'],
  ['Telegram «приMEIRAчная»', 'Мейра; в шапке — Ирина Осипова · стилист', 'Авторский голос'],
  ['Instagram bio', 'Строка 1: Ирина; строка 2: Мейра / метод', 'И деньги, и эмоция'],
];

const sevenParams: string[][] = [
  ['1', 'Внешний типаж', 'Природа лица, физика — без ярлыка «типаж как продукт» для клиентки'],
  ['2', 'Сегодняшний образ', 'Что носит и считает своим'],
  ['3', 'Палитра внешности', 'Цвета, которые «включают»'],
  ['4', 'Образ жизни', 'Ритм, обязанности'],
  ['5', 'События', 'Куда выходит, мероприятия'],
  ['6', 'Социальный код', 'Положение, окружение, роль'],
  ['7', 'Возраст и запрос', 'Как хочет восприниматься; «моложе лет» — значимый запрос'],
];

const fiveStages: string[][] = [
  ['1', 'Ревизия', 'По категориям; убрать неактуальное и потерявшее вид'],
  ['2', 'Активация', 'Вещи «хочу, но не ношу» — к ним комплекты'],
  ['3', 'Композиция', 'Комплекты к базе; фото каждого образа'],
  ['4', 'Контекст', 'Куда, чем заменить, чего избегать'],
  ['5', 'Карта покупок', 'Чек-лист: чего не хватает, сроки актуализации'],
];

const artifactPages: string[][] = [
  ['1', 'Обложка', '«Мой знак», имя, дата, монограмма'],
  ['2', 'Знак в 5 элементах', 'Базовый цвет, 2 акцента, силуэт, деталь, ритм'],
  ['3', 'Палитры вдохновения', '2–3 направления с оттенками'],
  ['4', '7 параметров', 'Краткая диагностика'],
  ['5–6', 'Три роли', 'Фото комплектов из гардероба'],
  ['7', 'Карта покупок', 'Срочно / год / отказаться'],
  ['8', 'Слова знака', 'Манифест 3–5 предложений от стилиста'],
];

const palettes: string[][] = [
  ['Морская', 'Море, тиффани, бирюза, утро на воде'],
  ['Венецианская', 'Вода в городе, дворцы, гондолы, камень и вода'],
  ['Горная', 'Земля и зелень, естественные оттенки'],
  ['Полевая', 'Поля цветов, лёгкость, цветение'],
  ['Глубина', 'Тёмные насыщенные тона для вечера и «вглядывания»'],
];

const instagramThemes: string[][] = [
  ['Антикейс', 'Почему цветотипы и архетипы не работают', '1 / нед', 'Reels 60 сек'],
  ['Трансформация', 'До/после разбора', '1 / нед', 'Карусель'],
  ['Знак недели', 'Публичный образ знаменитости', '1 / 2 нед', 'Reels 30 сек'],
  ['Палитра', 'Природа / искусство — как носить', '1 / нед', 'Карусель'],
  ['Провокация', 'Острый тезис', '1 / 2 нед', 'Reels'],
  ['B2B-кейс', 'Корпоративная программа изнутри', '1 / мес', 'Карусель'],
  ['Закулисье', 'Разбор / шопинг', '1 / 2 нед', 'Stories + Reels'],
  ['Быстрый совет', 'Лайфхак за 30 сек', '1 / нед', 'Reels'],
];

const shortsIdeas: string[][] = [
  ['Один цветотип — три разных женщины', 'Антишаблон', 'Высокий'],
  ['Что такое «Свой знак» за 45 сек', 'Метод', 'Высокий'],
  ['Ошибка после 40', 'Возраст', 'Средний'],
  ['Три вещи в шкафу, которые «убивают» знак', 'Разбор', 'Высокий'],
  ['Почему Pinterest вредит без стилиста', 'Провокация', 'Средний'],
];

const telegramThemes: string[][] = [
  ['Лонгрид', 'Философия метода, история клиентки', '1 / нед', '600–1000 слов'],
  ['Мысль вслух', 'Инсайты из практики', '2 / нед', '200–400 слов'],
  ['Разбор образа', 'Публичный образ', '1 / 2 нед', '400–600 слов'],
  ['Опрос', 'Сбор запросов', '1 / нед', 'Короткий'],
  ['Анонс', 'Лекции, публикации', 'По событию', '—'],
  ['Кейс B2B', 'Корп. программа (анонимно)', '1 / мес', '400–600 слов'],
];

const youtubeVideos: string[][] = [
  ['«Свой знак» за 20 минут', 'Базовая лекция', '1'],
  ['5 аргументов против цветотипов', 'Концепция', '2'],
  ['7 параметров: как я веду разбор', 'Образование', '3'],
  ['Знак руководителя (B2B)', 'B2B', '4'],
  ['Стиль после декрета', 'Эмоция', '5'],
  ['Разбор изнутри (влог)', 'Кейс', '6'],
  ['Палитры: Венеция, море, горы', 'Визуал', '7'],
  ['Климт, Вермеер и гардероб', 'Культура', '8'],
];

const vcArticles: string[][] = [
  ['Личный бренд руководителя через образ', 'Бизнес / HR', 'Мес. 2'],
  ['Типологии стиля — маркетинг, не наука', 'Провокация', 'Мес. 3'],
  ['Женщины-лидеры: выйти из тени', 'Кейс', 'Мес. 4'],
  ['Корп. стиль: ROI для компании', 'B2B', 'Мес. 5'],
  ['Индивидуальность как преимущество', 'Стратегия', 'Мес. 6'],
  ['Гардероб как система', 'Образование', 'Мес. 7'],
];

const pressThemes: string[][] = [
  ['Цветотипы устарели', 'Forbes Woman, Vogue, The Blueprint', 'Провокация'],
  ['Стиль после декрета', 'Cosmopolitan, ELLE, Wonder', 'Эмоция'],
  ['Знак руководителя', 'Forbes, RBC, Inc.', 'B2B'],
  ['Стиль после 40', 'The Voice, Tatler, Allure', 'Возраст'],
  ['7 параметров метода', 'ELLE, Allure, Buro', 'Метод'],
  ['Мама троих — не «размытая фигура»', 'Mel.fm, Familia', 'Эмоция'],
  ['От Климта к гардеробу', 'Forbes Life, Артгид', 'Культура'],
];

const lectures: string[][] = [
  ['«Свой знак»: что такое индивидуальный стиль', '60–90 мин', 'Широкая аудитория, open-talk'],
  ['Без копий: потеря себя в стилистике', '45–60 мин', 'Подкасты, длинные интервью'],
  ['Личный знак руководителя', '60–90 мин', 'B2B, women in business'],
  ['После паузы: вернуться через образ', '60 мин', 'Мамы, ретриты'],
  ['Стиль как искусство: от типологии к портрету', '75–90 мин', 'Музеи, премиум-клубы'],
];

const phase1Todos: TodoItem[] = [
  { id: 'p1-01', content: 'Сайт: Hero, Метод (5 этапов + 7 параметров), Услуги, цены, Обо мне', status: 'pending' },
  { id: 'p1-02', content: 'Персональный питч в 25 редакций (2 недели)', status: 'pending' },
  { id: 'p1-03', content: 'Instagram: bio + 12 стартовых постов', status: 'pending' },
  { id: 'p1-04', content: 'Telegram: канал + 10 постов + анонс из IG', status: 'pending' },
  { id: 'p1-05', content: '3 Reels: антицветотип, палитра моря, «Свой знак»', status: 'pending' },
  { id: 'p1-06', content: 'B2B PDF: 3 формата и цены', status: 'pending' },
  { id: 'p1-07', content: '50 HR + event-агентств — холодный аутрич', status: 'pending' },
  { id: 'p1-08', content: 'Артефакт: шаблон PDF 8 стр. + карточка', status: 'pending' },
  { id: 'p1-09', content: 'Пилотная бесплатная корп. лекция — отзыв', status: 'pending' },
  { id: 'p1-10', content: 'YouTube: первая лекция 20 мин', status: 'pending' },
  { id: 'p1-11', content: 'VC.ru: статья про личный бренд через образ', status: 'pending' },
  { id: 'p1-12', content: 'Цены на сайте: разбор 10–15к / 1,5 ч, шопинг 30–35к + прешопинг, B2B вход 50–70к', status: 'pending' },
  { id: 'p1-13', content: 'Pressfeed: регистрация и темы', status: 'pending' },
];

const phase2Todos: TodoItem[] = [
  { id: 'p2-01', content: '1–2 публикации в СМИ', status: 'pending' },
  { id: 'p2-02', content: 'Первая платная корп. лекция от 50–70к (вход)', status: 'pending' },
  { id: 'p2-03', content: 'YouTube: 1 видео / 2 недели + Shorts', status: 'pending' },
  { id: 'p2-04', content: 'Telegram 1000+', status: 'pending' },
  { id: 'p2-05', content: 'Instagram 5000+', status: 'pending' },
  { id: 'p2-06', content: 'B2B-пакет топ-команды от 350к', status: 'pending' },
  { id: 'p2-07', content: '2–3 бренд-коллаборации', status: 'pending' },
  { id: 'p2-08', content: '1 конференция / форум', status: 'pending' },
  { id: 'p2-09', content: '3 статьи VC.ru', status: 'pending' },
  { id: 'p2-10', content: 'Лид-магнит: PDF-тест «Свой знак за 10 мин»', status: 'pending' },
  { id: 'p2-11', content: 'CRM: клиентки + B2B + статусы', status: 'pending' },
];

const phase3Todos: TodoItem[] = [
  { id: 'p3-01', content: 'Forbes Woman / Vogue / The Blueprint', status: 'pending' },
  { id: 'p3-02', content: 'Instagram 10 000+', status: 'pending' },
  { id: 'p3-03', content: 'Доход 150–200к стабильно', status: 'pending' },
  { id: 'p3-04', content: 'Платный клуб или курс', status: 'pending' },
  { id: 'p3-05', content: 'Авторское мероприятие', status: 'pending' },
  { id: 'p3-06', content: 'Товарный знак «Свой знак»', status: 'pending' },
  { id: 'p3-07', content: 'Telegram 3000+', status: 'pending' },
  { id: 'p3-08', content: '5+ конференций за год', status: 'pending' },
  { id: 'p3-09', content: 'Ассистент / SMM', status: 'pending' },
];

const risks: string[][] = [
  ['Медленный рост Instagram', 'Высокая', 'Средний', 'Продвижение 5–10к/мес, коллабы, Reels ежедневно 3 мес.'],
  ['B2B не конвертируется', 'Средняя', 'Высокий', 'Пилотная лекция бесплатно — кейс и отзыв'],
  ['Нет СМИ на старте', 'Средняя', 'Средний', 'Персональный питч, VC.ru, Pressfeed'],
  ['Выгорание', 'Высокая', 'Высокий', 'Лимит B2C: 2 разбора + 6 шопингов/мес; ассистент на шопинге; батчинг контента; день без телефона'],
  ['Копирование метода', 'Средняя', 'Низкий', 'Товарный знак к мес. 9; кейсы и личность'],
  ['Давление «дайте цветотип»', 'Средняя', 'Средний', 'Манифест зафиксирован; не менять позицию под хайп'],
];

const milestones: string[][] = [
  ['Мес. 1', 'Сайт с методом «Свой знак»', 'Запуск'],
  ['Мес. 1', 'Питч в 25 редакций', 'PR'],
  ['Мес. 2', 'Первая публикация в СМИ', 'PR'],
  ['Мес. 2', 'Первое YouTube', 'Контент'],
  ['Мес. 3', 'Первая платная корп. лекция 50–70к', 'B2B'],
  ['Мес. 4', 'Telegram 1000+', 'Аудитория'],
  ['Мес. 5', 'B2B-пакет от 350к', 'B2B'],
  ['Мес. 6', '150к+ / мес; IG 5k+', 'Финансы'],
  ['Мес. 9', 'Сильная федеральная публикация', 'PR'],
  ['Мес. 12', 'Instagram 10k+', 'Аудитория'],
  ['Год 2', 'Платный продукт', 'Продукт'],
  ['Год 2', 'Авторское событие', 'Событие'],
  ['Год 3', 'Книга / международный выход', 'Масштаб'],
];

/** Типовая неделя как цикл месяца (~4 раза). Разборы и шопинги — отдельные выездные дни. Пн–Чт — полноценные садовские рабочие дни; подготовка к шаббату — в пт, не в пн. */
const personalWeekCalendar: string[][] = [
  [
    'Вс',
    '10:00–15:00 школа для еврейских детей; с 15:00 — семья до ночи.',
    'Работу не закладывать. Врачи/салон — в Ср (после 12:00 / подсад) или редко Пт до шаббата.',
  ],
  ['Сб', 'Шаббат — без работы и обычных поездок к врачу (кроме острой необходимости).', '—'],
  [
    'Пн–Чт (сад)',
    '08:30–09:00 отвод в сад. 10:30–12:00 основной офисный блок. 18:00–18:30 забор. С 18:30 — с детьми до ночи. Пн — такой же полноценный рабочий день, как вт–чт.',
    'Глубокая работа 10:30–12:00 (1,5 ч × 4 дня). Резерв 09:00–10:30 — опционально. Ср: врачи и салон в 12:00–18:00 или через подсад, не съедая 10:30–12.',
  ],
  [
    'Пт',
    'Подготовка к шаббату (закупки, быт); утро с детьми.',
    'Лёгкий админ 09:00–10:30 только если выделилось. Длинные B2B-звонки — в Пн–Чт 10:30–12:00.',
  ],
];

const assistantTriggers: string[][] = [
  ['Доход стабильно от 150к/мес', 'Искать VA или стажёра part-time'],
  ['Монтаж Reels, PDF, первичные DM сами', 'Отдать немедленно'],
  ['B2B-лиды висят неделями', 'Ассистент: поиск контактов и первое касание'],
  ['Контент раз в 2 недели или срывы', 'SMM-ассистент или пакет постов'],
];

const monthCapacity: string[][] = [
  ['Шопинги (6 шт.)', '6 дн.', 'Полный день на каждый'],
  ['Разборы (2 шт.)', '1,5 дн.', 'По 0,75 дня на разбор'],
  ['Лекции (2 шт.)', '2 дн.', 'Выступление + продюсирование (слайды, прогон)'],
  ['Reels + YouTube', '2,5 дн.', '1,5 дня Reels + 1 день YouTube (интервью)'],
  ['Врачи, салон, быт', '2 дн.', 'Среды (пакетом) или окна'],
  ['Контент-план, КП, админ', '3 дн.', 'Разбросано по окнам 10:30–12:00'],
  ['Остаток (буфер)', '5 дн.', 'Запас на форс-мажоры, болезни детей, отдых'],
];

// === TABS ===

function MethodTab() {
  return (
    <Stack gap={20}>
      <Callout tone="info" title="Формула стиля (философия)">
        Стиль = место + время + самовыражение + индивидуальность. Искусство и природа — вдохновение для стилиста,
        не ярлык для клиентки (не «вы — картина X»). Перепрошивка взгляда: стереотипы извне + устаревший взгляд на себя изнутри.
      </Callout>

      <H2>Семь параметров диагностики</H2>
      <Table headers={['№', 'Параметр', 'Содержание']} rows={sevenParams} striped stickyHeader />

      <H2>Пять этапов разбора</H2>
      <Table headers={['№', 'Этап', 'Содержание']} rows={fiveStages} striped />

      <H2>Три роли гардероба</H2>
      <Grid columns={3} gap={12}>
        <Card><CardHeader>Городская классика</CardHeader><CardBody><Text size="small" tone="secondary">Будни, работа, smart-casual в городе.</Text></CardBody></Card>
        <Card><CardHeader>Мамский будничный</CardHeader><CardBody><Text size="small" tone="secondary">Дом, дети, школа, площадка.</Text></CardBody></Card>
        <Card><CardHeader>Эффектный вечерний</CardHeader><CardBody><Text size="small" tone="secondary">Выход, события, ресторан.</Text></CardBody></Card>
      </Grid>

      <H2>Палитры вдохновения (библиотека)</H2>
      <Table headers={['Палитра', 'Содержание']} rows={palettes} striped />

      <H2>Практика сессии (2,5 ч)</H2>
      <Text size="small" tone="secondary">
        По категориям в шкафу; убрать неактуальное; комплекты к «застрявшим» вещам; комплекты к базе; всё фотографировать;
        комментарии по сочетаниям и контексту; Pinterest при необходимости; чек-лист покупок; итог в WhatsApp (фото + текст);
        после — шопинг или поддержка по фото из примерочной. Доля работы с установками — ориентир 30–50% времени.
      </Text>

      <H2>Артефакт «Свой знак» (PDF A5)</H2>
      <Table headers={['Стр.', 'Блок', 'Содержание']} rows={artifactPages} striped />

      <H2>Цены: было → рекомендовано</H2>
      <Table headers={['Услуга', 'Было', 'Рекомендовано']} rows={pricing} striped />

      <H2>B2B: прайс от «часа B2C»</H2>
      <Text size="small" tone="secondary">
        Ориентир: разбор даёт ~6,5–10к за час чистой работы; шопинг с прешопингом ~10–12к/ч. Корпоративный цикл (бриф, адаптация презентации, дорога, 90 мин на сцене, follow-up) ≈ 6–7 часов — ниже 50к лекция становится невыгоднее типового шопинга.
      </Text>
      <Table headers={['Формат', 'Прайс', 'Смысл']} rows={b2bPricingLogic} striped />

      <H2>Пять лекций (готовые темы)</H2>
      <Table headers={['Тема', 'Длительность', 'Аудитория']} rows={lectures} striped />
    </Stack>
  );
}

function StrategyTab() {
  return (
    <Stack gap={20}>
      <H2>Целевая аудитория</H2>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader>B2C</CardHeader>
          <CardBody>
            <Text size="small" tone="secondary">
              Женщина 35–55, город, работа и/или дети; после декрета, смены работы, возраста;
              хочет выглядеть моложе и «своей»; устала от типологий; готова к инвестиции в образ.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>B2B</CardHeader>
          <CardBody>
            <Text size="small" tone="secondary">
              HR и L&D, event-агентства, женские клубы, премиум-клиники и фитнес, бренды с аудиторией 30+,
              корпоративные университеты. Закупают лекции и программы «Свой знак» для лидеров.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <H2>Горизонты развития</H2>
      <Table
        headers={['Период', 'Фаза', 'Фокус', 'KPI', 'Доход']}
        rows={horizons}
        rowTone={[undefined, undefined, 'success', undefined]}
        striped
        stickyHeader
      />

      <Divider />

      <H2>Модель доходов</H2>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader trailing={<Pill size="sm" tone="info">70%</Pill>}>B2B, лекции, медиа</CardHeader>
          <CardBody>
            <Text size="small" tone="secondary">
              Основное рабочее время: корп. лекции и программы (вход 50–70к, со статусом 120–250к, программы от 350к), коллаборации, интервью, YouTube, колонки, подкасты — репутация и входящий B2B.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill size="sm">30%</Pill>}>Личные клиенты</CardHeader>
          <CardBody>
            <Text size="small" tone="secondary">
              Фиксированный слот: 2 разбора гардероба (10–15к / 1,5 ч) + 6 шопингов (30–35к + прешопинг) в месяц; лист ожидания. Сверх лимита — не брать. Кейсы для контента и питчей.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <Callout tone="success" title="Telegram: приMEIRAчная">
        Название канала — игра слов «примечательная» + Meira/Мейра. В контент-плане канала ориентир{' '}
        <Text weight="semibold">70–80% постов на B2B и метод</Text> (HR, лидеры, лекции, кейсы корпораций); остальное — личное и человечность. Полный календарь на 30 дней: файл{' '}
        <Text weight="semibold">документы/телеграм-приMEIRAчная-30-дней.md</Text>.
      </Callout>

      <Callout tone="neutral" title="Архитектура имени: Ирина и Мейра">
        <Table headers={['Где', 'Подпись', 'Зачем']} rows={nameArchitecture} striped />
      </Callout>

      <Callout tone="info" title="Доход при текущем ритме календаря">
        B2C при полном слоте: 2 разбора + 6 шопингов ≈ <Text weight="semibold">200–240к ₽/мес</Text> (верх с артефактом — до ~280к).
        Поверх — 2–3 корп. лекции по входу (~60к): <Text weight="semibold">+120–180к</Text>. Коридор без «потолка статуса»:{' '}
        <Text weight="semibold">~320–420к ₽/мес</Text>, если B2C закрыт и лекции идут ритмом. Узкое место — часы на B2B-аутрич (Пн–Чт 10:30–12).
      </Callout>

      <Divider />

      <H2>Ключевые активы бренда</H2>
      <Grid columns={2} gap={20}>
        <Stack gap={6}>
          <Text weight="semibold">Позиционирование</Text>
          <Text size="small" tone="secondary">
            Стилист, лектор, автор метода «Свой знак». osipovastyle.ru. Ученица Рогова и Карцева. 9 лет практики.
            Не «методолог» — живой голос. Не «главная героиня» — избегаем ТВ/инфоцыганских ассоциаций.
          </Text>
        </Stack>
        <Stack gap={6}>
          <Text weight="semibold">Голос бренда</Text>
          <Text size="small" tone="secondary">
            Профессионально, без инфоцыганства. Конкретные кейсы. «У вас уже есть знак — я помогаю его найти».
          </Text>
        </Stack>
        <Stack gap={6}>
          <Text weight="semibold">Визуальный код</Text>
          <Text size="small" tone="secondary">
            Минимализм: светлый фон, один акцент, монограмма-знак, сильная типографика.
          </Text>
        </Stack>
        <Stack gap={6}>
          <Text weight="semibold">Каналы</Text>
          <Text size="small" tone="secondary">
            Instagram → Telegram → YouTube → Пресса → VC.ru. Взаимное усиление.
          </Text>
        </Stack>
      </Grid>

      <Callout tone="neutral" title="Hero сайта (черновик)">
        Свой знак. Стиль, который не повторят. Я не работаю по типажам и цветотипам — помогаю найти узнаваемый авторский знак.
      </Callout>
    </Stack>
  );
}

function ContentTab({ channel, setChannel }: { channel: string; setChannel: (v: string) => void }) {
  return (
    <Stack gap={20}>
      <Row gap={8} wrap>
        {([['instagram', 'Instagram'], ['shorts', 'Shorts'], ['telegram', 'Telegram'], ['youtube', 'YouTube'], ['vc', 'VC.ru'], ['press', 'Пресса']] as [string, string][]).map(([id, label]) => (
          <Pill key={id} active={channel === id} onClick={() => setChannel(id)}>{label}</Pill>
        ))}
      </Row>

      {channel === 'instagram' && (
        <Stack gap={16}>
          <Grid columns={3} gap={12}>
            <Stat value="5" label="постов / нед" />
            <Stat value="3" label="Reels / нед" />
            <Stat value="Ежедн." label="Stories" />
          </Grid>
          <H3>Темы и форматы</H3>
          <Table headers={['Тема', 'Содержание', 'Частота', 'Формат']} rows={instagramThemes} striped />
          <Callout tone="info" title="Неделя (шаблон)">
            Пн — антикейс (Reels ~60 сек). Ср — карусель (трансформация или палитра). Пт — провокация или «знак недели».
            Опросы в Stories 3× / нед. Эфир раз в 2 недели — разбор чужого образа. Каждый Reels — вопрос в конце; ответы на комментарии в первые 3 часа.
          </Callout>
        </Stack>
      )}

      {channel === 'shorts' && (
        <Stack gap={16}>
          <H3>Идеи Shorts (нарезка с длинных видео + отдельные)</H3>
          <Table headers={['Идея', 'Тип', 'Приоритет']} rows={shortsIdeas} striped />
          <Text size="small" tone="secondary">
            С каждого ролика YouTube 20 мин — 3–4 Shorts: тезис + призыв подписаться + ссылка на полную лекцию в описании IG/TG.
          </Text>
        </Stack>
      )}

      {channel === 'telegram' && (
        <Stack gap={16}>
          <Callout tone="info" title="Канал приMEIRAчная">
            Личный голос — <Text weight="semibold">Мейра</Text>; в шапке склейка с <Text weight="semibold">Ирина Осипова</Text>. Месячный план:{' '}
            <Text weight="semibold">~70–80% B2B/метод</Text>, остальное — личные истории и закулисье. Детальный текст 30 постов — в репозитории (см. стратегия-бренда HTML или файл документов).
          </Callout>
          <Grid columns={3} gap={12}>
            <Stat value="30" label="постов / мес (план)" />
            <Stat value="70–80%" label="доля B2B" tone="info" />
            <Stat value="1000+" label="TG к мес. 4" />
          </Grid>
          <H3>Форматы</H3>
          <Table headers={['Формат', 'Содержание', 'Частота', 'Объём']} rows={telegramThemes} striped />
          <Callout tone="neutral" title="Монетизация TG">
            После 500 подписчиков — закрытый платный чат 1–2к/мес с ежемесячным онлайн-разбором. До этого — бесплатный чат для клиенток.
          </Callout>
        </Stack>
      )}

      {channel === 'youtube' && (
        <Stack gap={16}>
          <Grid columns={3} gap={12}>
            <Stat value="1" label="видео / 2 нед" />
            <Stat value="20 мин" label="основа" />
            <Stat value="10k" label="цель подписчиков / год" />
          </Grid>
          <H3>Очередь роликов</H3>
          <Table headers={['Тема', 'Тип', '№']} rows={youtubeVideos} striped />
          <Callout tone="info" title="YouTube">
            Лекции дают поисковый трафик годами. B2B-заказчики часто смотрят запись перед контрактом.
          </Callout>
        </Stack>
      )}

      {channel === 'vc' && (
        <Stack gap={16}>
          <Table headers={['Тема', 'Угол', 'Месяц']} rows={vcArticles} striped />
          <Callout tone="neutral" title="VC.ru">
            Читают HR и предприниматели. Статья живёт в поиске. 1 материал в месяц.
          </Callout>
        </Stack>
      )}

      {channel === 'press' && (
        <Stack gap={16}>
          <Table headers={['Тема', 'Издания', 'Тип']} rows={pressThemes} striped />
          <Callout tone="warning" title="Питч редактору — тема письма">
            «Стилист без цветотипов — метод „Свой знак“». Персональное письмо: почему тема зайдёт именно их аудитории. Ответ в течение 4 часов на входящие.
          </Callout>
        </Stack>
      )}
    </Stack>
  );
}

function TodosTab({ phase, setPhase }: { phase: string; setPhase: (v: string) => void }) {
  return (
    <Stack gap={20}>
      <Row gap={8} wrap>
        <Pill active={phase === 'phase1'} onClick={() => setPhase('phase1')}>Мес. 1–3</Pill>
        <Pill active={phase === 'phase2'} onClick={() => setPhase('phase2')}>Мес. 4–6</Pill>
        <Pill active={phase === 'phase3'} onClick={() => setPhase('phase3')}>Мес. 7–12</Pill>
      </Row>

      {phase === 'phase1' && (
        <Stack gap={12}>
          <Callout tone="info" title="Запуск">
            Сайт, питч, контент, первая лекция, артефакт. Цель: 1 корп. контракт и 1–2 СМИ.
          </Callout>
          <TodoListCard todos={phase1Todos} defaultExpanded />
        </Stack>
      )}

      {phase === 'phase2' && (
        <Stack gap={12}>
          <Callout tone="neutral" title="Рост">
            Конверсия медиа в B2B. Цель: 100–150к стабильно.
          </Callout>
          <TodoListCard todos={phase2Todos} defaultExpanded />
        </Stack>
      )}

      {phase === 'phase3' && (
        <Stack gap={12}>
          <Callout tone="success" title="Масштаб">
            150–200к, федеральная пресса, продукт. Цель: меньше холодных продаж.
          </Callout>
          <TodoListCard todos={phase3Todos} defaultExpanded />
        </Stack>
      )}
    </Stack>
  );
}

function MediaTab() {
  return (
    <Stack gap={20}>
      <H2>PR</H2>
      <Grid columns={3} gap={12}>
        <Card>
          <CardHeader>Питч 25 редакций</CardHeader>
          <CardBody>
            <Text size="small" tone="secondary">
              7 тем (см. вкладка Контент — Пресса). Первые 2 недели после запуска сайта. Персонализация каждому редактору.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Pressfeed</CardHeader>
          <CardBody>
            <Text size="small" tone="secondary">
              Темы: стиль, мода, личный бренд, женщины, карьера. Быстрые ответы на запросы журналистов.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Подкасты</CardHeader>
          <CardBody>
            <Text size="small" tone="secondary">
              10–15 женских подкастов. Крючок: стилист против цветотипов.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <Divider />

      <H2>B2B-аутрич</H2>
      <Table
        headers={['Сегмент', 'Канал', 'Предложение', 'KPI']}
        rows={[
          ['HR крупных компаний', 'LinkedIn + письмо + VC.ru', 'Лекция 90 мин + программа', '2 встречи / мес'],
          ['Event-агентства', 'Письмо + PDF спикера', 'Лекция в мероприятии', '5 в базе'],
          ['Бренды fashion/beauty', 'IG DM + встреча', 'Коллаб / шоу-рум', '2–3 партнёра'],
          ['Женские бизнес-клубы', 'Рекомендация + контакт', 'Закрытое выступление', '1 / мес'],
          ['Премиум клиники / фитнес', 'Партнёрское письмо', 'Лекция для VIP', '2 партнёра'],
          ['Корп. университеты', 'Письмо + CV + YouTube', 'Модуль L&D', '1 к мес. 6'],
        ]}
        striped
      />

      <Divider />

      <H2>Аудитория: удержание</H2>
      <Grid columns={2} gap={20}>
        <Stack gap={6}>
          <Text weight="semibold">Instagram</Text>
          <Text size="small" tone="secondary">
            Вопрос в конце Reels. Комментарии — первые 3 часа. Опросы в Stories. Эфир раз в 2 недели.
          </Text>
        </Stack>
        <Stack gap={6}>
          <Text weight="semibold">Telegram</Text>
          <Text size="small" tone="secondary">
            Открытый канал + чат клиенток. Платный клуб после 500 подписчиков канала.
          </Text>
        </Stack>
        <Stack gap={6}>
          <Text weight="semibold">Email</Text>
          <Text size="small" tone="secondary">
            Лид-магнит PDF. Рассылка 2× в месяц. Защита от блокировок соцсетей.
          </Text>
        </Stack>
        <Stack gap={6}>
          <Text weight="semibold">Реферал</Text>
          <Text size="small" tone="secondary">
            Промокод −10% подруге. Благодарность за рекомендации внутри компаний (лучший B2B-канал).
          </Text>
        </Stack>
      </Grid>

      <Callout tone="info" title="Список направлений СМИ (для базы)">
        Forbes, Forbes Woman, RBC, RBC Style, Inc., The Bell, Деловой квартал; Vogue, ELLE, Tatler, Allure, The Voice, Wonder, Hello!, Cosmo;
        The Blueprint, Афиша, Buro, Snob; Mel.fm, Familia, Домашний очаг; Артгид, Большой город.
      </Callout>
    </Stack>
  );
}

function PersonalTab() {
  return (
    <Stack gap={20}>
      <Callout tone="info" title="Один канвас">
        Стратегия бренда, метод, контент, медиа, риски и личный календарь — в этом файле. Расширенный текст, чек-листы и
        HTML для печати: <Text weight="semibold">стратегия-бренда/бренд-стратегия.html</Text> в репозитории.
      </Callout>

      <H2>Личное: календарь и реальные часы</H2>
      <Text size="small" tone="secondary">
        Опорный каркас недели (повторяется ~4 раза в месяц). Слот 2 разбора + 6 шопингов закладывать отдельно как выездные дни.
      </Text>

      <Table
        headers={['День', 'Обязательства', 'Работа / врачи / уход за собой']}
        rows={personalWeekCalendar}
        striped
        stickyHeader
      />

      <H3>Ёмкость месяца (22 рабочих дня)</H3>
      <Text size="small" tone="secondary">
        Примерный расчёт в полных днях (даже если часы разбросаны по неделе).
      </Text>
      <Table headers={['Активность', 'Дней / мес', 'Комментарий']} rows={monthCapacity} striped />
      <Stack gap={8} style={{ marginTop: 8 }}>
        <Callout tone="info" title="Итог по загрузке">
          Из 22 рабочих дней (пн–пт) жёстко занято <Text weight="semibold">~17 дней</Text>. Остаётся 5 дней буфера. Если лекций становится 3–4, они съедают буфер — тогда нужно делегировать админ и контент-план.
        </Callout>
      </Stack>

      <H3>Сколько часов «стола» в неделю</H3>
      <Stack gap={8}>
        <Callout tone="neutral" title="Минимум по календарю">
          Пн–Чт по 1,5 ч (10:30–12:00) = <Text weight="semibold">6 ч/нед</Text>. В месяце ~<Text weight="semibold">24 ч</Text> без опциональных окон.
        </Callout>
        <Callout tone="neutral" title="Расширенный план">
          Резерв 09:00–10:30 на Пн–Чт хотя бы 2 раза в неделю (+3 ч), лёгкий Пт ~1,5 ч, при свободной ср после визитов — фокус после 12:00 → ориентир <Text weight="semibold">9–13 ч/нед</Text> (~<Text weight="semibold">36–52 ч/мес</Text>) без выездов на разборы и шопинги.
        </Callout>
        <Text size="small" tone="secondary">
          Вывод: «столовые» окна — <Text weight="semibold">Пн–Чт 10:30–12:00</Text>. Созвоны с HR — туда или первое касание ассистенту.
        </Text>
      </Stack>

      <H3>Типовой день: понедельник–четверг (сад)</H3>
      <Grid columns={2} gap={12}>
        <Card><CardHeader>07:00–08:30</CardHeader><CardBody><Text size="small" tone="secondary">Сборы, завтрак. Без «быстрых» писем — присутствие с детьми.</Text></CardBody></Card>
        <Card><CardHeader>08:30–09:00</CardHeader><CardBody><Text size="small" tone="secondary">Отвод в сад.</Text></CardBody></Card>
        <Card><CardHeader>09:00–10:30</CardHeader><CardBody><Text size="small" tone="secondary">Опционально: дорога и подготовка к блоку. Не считать гарантированной глубокой работой.</Text></CardBody></Card>
        <Card><CardHeader>10:30–12:00</CardHeader><CardBody><Text size="small" tone="secondary">Главный блок: один приоритет, телефон «не беспокоить».</Text></CardBody></Card>
        <Card><CardHeader>12:00–18:00</CardHeader><CardBody><Text size="small" tone="secondary">Дом, обед, поездки без ожидания продуктивной работы, если не оговорено иное.</Text></CardBody></Card>
        <Card><CardHeader>18:00–ночь</CardHeader><CardBody><Text size="small" tone="secondary">Забор, вечер с семьёй. Работа — только форс-мажор 10–15 мин.</Text></CardBody></Card>
      </Grid>

      <H3>Ассистент (когда пора)</H3>
      <Table headers={['Сигнал', 'Действие']} rows={assistantTriggers} striped />

      <Callout tone="warning" title="Нельзя делегировать">
        Финальные стилистические решения, голос бренда, переговоры B2B со второго касания, проведение разборов и лекций, контент от первого лица с вашим лицом.
      </Callout>
    </Stack>
  );
}

function RisksTab() {
  return (
    <Stack gap={20}>
      <H2>Риски</H2>
      <Table headers={['Риск', 'Вероятность', 'Влияние', 'Митигация']} rows={risks} striped />

      <Divider />

      <H2>Milestones</H2>
      <Table
        headers={['Когда', 'Событие', 'Тип']}
        rows={milestones}
        rowTone={milestones.map((_, i): 'success' | 'info' | undefined => {
          if (i === 7) return 'success';
          if (i === 9) return 'info';
          return undefined;
        })}
        striped
        stickyHeader
      />

      <Callout tone="warning" title="Рассредоточение">
        Лимит B2C: 2 разбора гардероба + 6 шопингов в месяц; всё остальное — B2B-заказы, лекции, медиа. Полный документ и личный блок: вкладка «Личное» в этом канвасе + файл стратегия-бренда/бренд-стратегия.html.
      </Callout>
    </Stack>
  );
}

// === ROOT ===

export default function BrandStrategy() {
  const [activeTab, setActiveTab] = useCanvasState<string>('strategy');
  const [contentChannel, setContentChannel] = useCanvasState<string>('instagram');
  const [todosPhase, setTodosPhase] = useCanvasState<string>('phase1');

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Stack gap={4}>
        <H1>Метод «Свой знак» — Бренд-стратегия</H1>
        <Text tone="secondary">Ирина Осипова · Стилист, лектор, автор метода · osipovastyle.ru · Горизонт 36 мес.</Text>
      </Stack>

      <Grid columns={6} gap={10}>
        <Stat value="150–200к" label="цель / мес." />
        <Stat value="70%" label="B2B+медиа" tone="info" />
        <Stat value="25" label="редакций" tone="info" />
        <Stat value="9 лет" label="практика" />
        <Stat value="2" label="разборов / мес." />
        <Stat value="6" label="шопингов / мес." />
      </Grid>

      <Row gap={8} wrap>
        {([
          ['strategy', 'Стратегия'],
          ['method', 'Метод'],
          ['content', 'Контент'],
          ['todos', 'TODO'],
          ['media', 'Медиа и B2B'],
          ['risks', 'Риски'],
          ['personal', 'Личное'],
        ] as [string, string][]).map(([id, label]) => (
          <Pill key={id} active={activeTab === id} onClick={() => setActiveTab(id)}>{label}</Pill>
        ))}
      </Row>

      <Divider />

      {activeTab === 'strategy' && <StrategyTab />}
      {activeTab === 'method' && <MethodTab />}
      {activeTab === 'content' && <ContentTab channel={contentChannel} setChannel={setContentChannel} />}
      {activeTab === 'todos' && <TodosTab phase={todosPhase} setPhase={setTodosPhase} />}
      {activeTab === 'media' && <MediaTab />}
      {activeTab === 'risks' && <RisksTab />}
      {activeTab === 'personal' && <PersonalTab />}
    </Stack>
  );
}
