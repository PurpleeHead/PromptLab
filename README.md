# PromptLab — AI Prompt Workspace

**PromptLab** is a responsive, local-first workspace for building a reusable library of AI prompts. It helps users organize instructions, find templates quickly, customize them with variables, preview the final text, and keep useful prompts ready for repeated tasks. Built with React and TypeScript, it provides a practical foundation for a more capable AI productivity tool.

- **Live demo:** https://purpleehead.github.io/PromptLab/
- **Repository:** https://github.com/PurpleeHead/PromptLab

> PromptLab is an independent portfolio project. It is not affiliated with or endorsed by any AI provider. The core workflow does not require an AI API key or paid AI service.

## Features

- Create, edit, duplicate, favorite, and delete prompts.
- Search and filter the prompt library; sort prompts and organize them into collections.
- Reuse templates with variables such as `{{topic}}` and preview the rendered result.
- Keep prompt edit-history snapshots.
- Import validated JSON data and export workspace backups as JSON or prompts as CSV.
- Switch the interface language without translating or rewriting saved prompts.
- Choose a dark or light theme.
- Use the core workspace without creating an account.
- Access an optional Supabase sign-in/sign-up flow when configured.
- Use a responsive layout with mobile navigation and reduced-motion support.

## Tech stack

- React 19, TypeScript, Vite
- React Router
- SCSS
- Lucide React
- Vitest, Testing Library, jsdom
- Optional Supabase client and SQL migration

## Getting started

### Requirements

- Node.js 22 or a compatible current LTS release
- npm

### Install and run

```bash
git clone https://github.com/PurpleeHead/PromptLab.git
cd PromptLab
npm ci
npm run dev
```

Open the local URL printed by Vite.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run test:run` | Run the test suite once |
| `npm run test` | Start Vitest in watch mode |
| `npm run build` | Typecheck and create a production build |
| `npm run preview` | Preview the production build locally |

## Data and privacy

The core workspace stores prompts, collections, settings, and feedback in the current browser's `localStorage`. This keeps the basic workflow local and available without an account, but browser storage is **not a cloud backup** and can be cleared. Export a JSON backup regularly if your prompts matter to you.

Feedback is saved locally in this version and is not automatically sent to the project owner. Prompt content stays in the browser unless you export it or explicitly use a configured cloud feature. Avoid storing passwords, private information, or secret API keys in prompts.

## Optional Supabase configuration

Supabase is optional; local mode does not require it. The repository includes an authentication flow, a client helper, and an initial SQL migration. Cloud synchronization of ordinary prompt and collection changes is not currently a complete, release-verified workflow, so do not treat Supabase as an automatic backup.

1. Create a Supabase project and apply `supabase/migrations/0001_initial_schema.sql`.
2. Configure the project's authentication Site URL and allowed redirect URLs for your local and deployed origins.
3. Copy `.env.example` to `.env.local` and set the public project URL and anon/publishable key:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
   ```

4. Restart the development server after changing environment variables.

Only public client configuration belongs in `VITE_*` variables. **Never expose a Supabase `service_role` key, database password, or other private credential in frontend code or a client-side environment variable.** Review row-level security policies and verify authentication redirects against your own Supabase project before using it publicly.

## Tests and verification

The test suite covers template variable parsing/rendering, local storage operations and imports/exports, Supabase row mapping, and translation helpers.

Local verification performed for the current repository version:

- `npm ci` — completed successfully.
- Vitest — 23 tests passed across 4 test files.
- `npm run build` — completed successfully.

Vite reports a non-blocking warning that the minified JavaScript chunk is larger than 500 kB. Code splitting can be added as a future optimization. Local checks do not guarantee every production hosting, authentication, or cloud workflow is configured correctly.

## Deployment

### GitHub Pages

The repository includes GitHub Actions workflows for checks and Pages deployment. Enable **GitHub Actions** as the Pages source in the repository settings. Pushes to `main` trigger the configured workflow; check the Actions tab for the actual result.

### Netlify

Use the repository root as the base directory, `npm run build` as the build command, and `dist` as the publish directory. The repository includes a `netlify.toml` SPA fallback configuration.

After deploying, open the live URL and refresh the page to verify that assets and navigation work on the hosting provider.

## Project status and limitations

PromptLab is a portfolio project and is still evolving. The main local prompt-management workflow, bilingual UI, theme switch, import/export utilities, and test suite are implemented. Optional authentication depends on external Supabase configuration; automatic cloud synchronization, real feedback delivery, and a full end-to-end browser test suite are not currently release-verified.

## License

No open-source license has been selected yet. Unless a license is added, the code is not granted the broad reuse permissions that an open-source license provides.

---

## Русская версия

**PromptLab** — адаптивное приложение для создания и ведения собственной библиотеки AI-промптов. Оно помогает систематизировать инструкции, быстро находить нужные шаблоны, подставлять переменные, проверять итоговый текст и повторно использовать удачные решения. Проект построен на React и TypeScript и служит основой для дальнейшего развития в инструмент продуктивности для работы с AI.

- **Демо:** https://purpleehead.github.io/PromptLab/
- **Репозиторий:** https://github.com/PurpleeHead/PromptLab

> PromptLab — независимый портфолио-проект. Он не связан с какими-либо AI-провайдерами. Для основных функций не нужен платный API или ключ от AI-сервиса.

### Возможности

- Создание, редактирование, дублирование, добавление в избранное и удаление промптов.
- Поиск, фильтрация и сортировка библиотеки; организация промптов в подборки.
- Переменные в шаблонах, например `{{topic}}`, и предварительный просмотр готового текста.
- Сохранение снимков истории редактирования промпта.
- Импорт проверенных JSON-данных, экспорт резервной копии в JSON и экспорт промптов в CSV.
- Переключение языка интерфейса без перевода или изменения сохранённых промптов.
- Светлая и тёмная темы.
- Основной функционал без регистрации.
- Необязательная авторизация через Supabase при соответствующей настройке.
- Адаптивная вёрстка, мобильная навигация и поддержка настройки уменьшения анимации.

### Технологии

- React 19, TypeScript, Vite
- React Router
- SCSS
- Lucide React
- Vitest, Testing Library, jsdom
- Необязательные Supabase-клиент и SQL-миграция

### Запуск локально

**Требования:** Node.js 22 или совместимая актуальная LTS-версия и npm.

```bash
git clone https://github.com/PurpleeHead/PromptLab.git
cd PromptLab
npm ci
npm run dev
```

Открой локальный адрес, который выведет Vite.

### Команды npm

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Запуск сервера разработки |
| `npm run typecheck` | Проверка TypeScript |
| `npm run lint` | Проверка ESLint |
| `npm run test:run` | Однократный запуск тестов |
| `npm run test` | Vitest в режиме наблюдения |
| `npm run build` | Проверка TypeScript и production-сборка |
| `npm run preview` | Локальный просмотр production-сборки |

### Данные и конфиденциальность

Промпты, подборки, настройки и отзывы сохраняются в `localStorage` текущего браузера. Основной сценарий работает локально и не требует аккаунта, но **локальное хранилище не является облачной резервной копией** и может быть очищено браузером. Если данные важны, регулярно экспортируй резервную копию в JSON.

В текущей версии отзывы сохраняются локально и автоматически не отправляются автору проекта. Содержимое промптов остаётся в браузере, если пользователь не экспортирует его или явно не использует настроенную облачную функцию. Не сохраняй в промптах пароли, приватные данные и секретные API-ключи.

### Необязательная настройка Supabase

Supabase не требуется для локального режима. В репозитории есть сценарий авторизации, клиентский helper и начальная SQL-миграция. Автоматическая синхронизация обычных изменений промптов и подборок пока не является полностью проверенной функцией, поэтому не используй Supabase как автоматическую резервную копию.

1. Создай проект Supabase и примени `supabase/migrations/0001_initial_schema.sql`.
2. Настрой Site URL и разрешённые redirect URL для локального и опубликованного приложения.
3. Скопируй `.env.example` в `.env.local` и укажи публичный URL проекта и anon/publishable key:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
   ```

4. Перезапусти сервер разработки после изменения переменных окружения.

В переменных `VITE_*` допустима только публичная клиентская конфигурация. **Никогда не добавляй ключ Supabase `service_role`, пароль базы данных или другие секреты в клиентский код и frontend-переменные окружения.** Перед публичным использованием проверь RLS-политики и редиректы авторизации в своём проекте Supabase.

### Тесты и проверка

Тесты проверяют обработку переменных шаблонов, локальное хранение и импорт/экспорт данных, преобразование данных Supabase и функции локализации.

Результаты локальной проверки текущей версии:

- `npm ci` — успешно.
- Vitest — пройдены 23 теста в 4 файлах.
- `npm run build` — успешно.

Vite выводит некритичное предупреждение: минифицированный JavaScript-бандл превышает 500 КБ. В дальнейшем размер можно уменьшить разделением кода на чанки. Успешные локальные проверки не гарантируют, что каждая настройка хостинга, авторизации или облачной интеграции корректна.

### Публикация

**GitHub Pages:** в настройках репозитория выбери GitHub Actions в качестве источника Pages. В репозитории есть workflows для проверок и деплоя; фактический результат смотри во вкладке Actions.

**Netlify:** корневая директория — корень репозитория, команда сборки — `npm run build`, папка публикации — `dist`. В репозитории есть `netlify.toml` с fallback для SPA.

После публикации открой сайт и обнови страницу, чтобы проверить загрузку ресурсов и работу навигации.

### Статус и ограничения проекта

PromptLab — развивающийся портфолио-проект. Основные сценарии локального управления промптами, двуязычный интерфейс, переключение темы, импорт/экспорт и тесты реализованы. Необязательная авторизация зависит от настройки Supabase; автоматическая облачная синхронизация, реальная отправка отзывов и полноценные end-to-end браузерные тесты пока не прошли релизную проверку.

### Лицензия

Открытая лицензия пока не выбрана. Пока лицензия не добавлена, широкие права на повторное использование кода не предоставляются.
