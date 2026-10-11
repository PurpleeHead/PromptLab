# PromptLab — AI Prompt Workspace

[**Live Demo**](https://purpleehead.github.io/PromptLab/) · [Repository](https://github.com/PurpleeHead/PromptLab)

**PromptLab** is a local-first workspace for writing, organizing, previewing, and reusing AI prompt templates. It helps keep prompts structured and reusable instead of scattered across notes and documents. The app does not require an AI API key or an account for its core local workflow.

> **Demo privacy note:** The demo runs in your browser. Prompts, collections, settings, and feedback are stored in browser `localStorage`; they are not automatically synced to a cloud account. Avoid entering secrets or private data. Use the JSON export to back up your work.

## Features

- **Prompt library:** create, edit, duplicate, favorite, and delete prompts.
- **Search and discovery:** search prompt titles, descriptions, bodies, and tags; filter and sort the library.
- **Reusable templates:** use `{{variable_name}}` placeholders and preview the rendered prompt with values filled in.
- **Collections:** group related prompts into named collections.
- **Prompt history:** keep snapshots of edits for supported prompt workflows.
- **Import and export:** export workspace data as JSON, export prompts as CSV, and import validated JSON backups.
- **Personalization:** switch between dark and light themes.
- **Responsive navigation:** use the workspace on desktop and smaller screens, including mobile sidebar controls.
- **Local-first by default:** core prompt management works without an account or paid AI service.
- **Optional Supabase foundation:** the repository includes authentication and database integration helpers, but full cloud synchronization is not currently exposed as a complete user workflow.

## Tech stack

- React 19 and TypeScript
- Vite 7
- React Router
- SCSS / CSS
- Lucide React icons
- React Hook Form and Zod
- Supabase client (optional)
- Vitest, Testing Library, ESLint
- GitHub Actions and GitHub Pages

## How it works

1. Create a prompt and add a title, description, category, tags, and body.
2. Insert variables such as `{{topic}}` or `{{tone}}` where you want customizable values.
3. Preview the template with sample values and reuse the result in your preferred AI tool.
4. Keep prompts organized with favorites, filters, and collections.
5. Export a JSON backup periodically so your local workspace can be restored later.

PromptLab organizes prompts; it does not itself generate AI responses or send prompt text to an AI provider.

## Run locally

### Requirements

- Node.js 22 (or a compatible current LTS release)
- npm

```bash
git clone https://github.com/PurpleeHead/PromptLab.git
cd PromptLab
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run test:run` | Run tests once |
| `npm run build` | Typecheck and build the production app |
| `npm run preview` | Preview the production build locally |

## Data and privacy

- Prompt content, collections, settings, and feedback are stored in the current browser profile using `localStorage`.
- Local data is not a cloud backup and can be lost if browser data is cleared or the profile/device is lost.
- JSON is the recommended format for workspace backups; CSV is useful for tabular prompt exports but does not preserve all workspace relationships/history.
- Feedback is stored locally in the current implementation; it is not a support ticket sent to the developer.
- Do not save passwords, API keys, or other secrets in prompts.
- Supabase configuration is optional. Cloud sign-in/integration code exists, but automatic sync and a complete user-facing cloud backup workflow are not currently available.

## GitHub Pages deployment

This repository contains a GitHub Actions workflow that installs dependencies, runs checks, builds the app with the `/PromptLab/` base path, and deploys the `dist` output to GitHub Pages on pushes to `main`.

To enable it in repository settings:

1. Open **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` or run **Actions → Deploy to GitHub Pages → Run workflow**.
4. Wait for the workflow to complete, then open the live demo link at the top of this README.

The deployment workflow must pass before the live demo is considered published. If the first deployment fails, open the Actions run to inspect the failing check.

## Current limitations

- The app manages prompt templates; it does not call an AI model or produce generated responses.
- Cloud authentication/synchronization is not a complete, release-verified workflow; treat the app as local-first.
- The locale dictionaries exist in the codebase, but full user-facing localization across all routed screens is not complete. The current interface is primarily English.
- There is no automated end-to-end browser suite configured yet.
- No license has been selected for this repository. All rights remain with the copyright holder unless a license is added.

---

# PromptLab — рабочее пространство для AI-промптов

[**Открыть демо**](https://purpleehead.github.io/PromptLab/) · [Репозиторий на GitHub](https://github.com/PurpleeHead/PromptLab)

**PromptLab** — приложение для создания, организации, предварительного просмотра и повторного использования шаблонов промптов. Оно помогает хранить запросы в структурированном виде, а не разбрасывать их по заметкам и документам. Для основных локальных функций не нужны аккаунт, ключ API или платная AI-подписка.

> **Важно о данных в демо:** приложение работает в браузере. Промпты, коллекции, настройки и обратная связь сохраняются в `localStorage` текущего браузера и автоматически не синхронизируются с облаком. Не вводите секретные или конфиденциальные данные. Для резервной копии используйте экспорт JSON.

## Возможности

- **Библиотека промптов:** создание, редактирование, дублирование, добавление в избранное и удаление.
- **Поиск:** поиск по названиям, описаниям, тексту промптов и тегам, фильтрация и сортировка.
- **Шаблоны с переменными:** поддержка плейсхолдеров вида `{{variable_name}}` и предварительный просмотр результата с подставленными значениями.
- **Коллекции:** группировка связанных промптов.
- **История:** сохранение снимков изменений в поддерживаемых сценариях работы с промптами.
- **Импорт и экспорт:** резервная копия рабочего пространства в JSON, экспорт промптов в CSV и импорт проверенных JSON-файлов.
- **Настройка интерфейса:** светлая и тёмная темы.
- **Адаптивность:** интерфейс для компьютеров и мобильных устройств, включая мобильную боковую навигацию.
- **Локальная работа:** управление промптами доступно без регистрации и платных AI-сервисов.
- **Основа для интеграции с Supabase:** в проекте есть код авторизации и работы с базой данных, но полноценная пользовательская облачная синхронизация пока не реализована как законченный сценарий.

## Технологии

- React 19 и TypeScript
- Vite 7
- React Router
- SCSS / CSS
- Lucide React
- React Hook Form и Zod
- Supabase client (опционально)
- Vitest, Testing Library, ESLint
- GitHub Actions и GitHub Pages

## Как пользоваться

1. Создайте промпт и заполните название, описание, категорию, теги и основной текст.
2. Добавьте переменные, например `{{topic}}` или `{{tone}}`, чтобы переиспользовать один шаблон с разными параметрами.
3. Проверьте шаблон в предварительном просмотре и используйте готовый текст в выбранном AI-инструменте.
4. Организуйте библиотеку с помощью избранного, фильтров и коллекций.
5. Периодически экспортируйте JSON, чтобы иметь резервную копию.

PromptLab помогает организовывать промпты, но сам не генерирует ответы нейросети и не отправляет текст промптов AI-провайдерам.

## Локальный запуск

### Требования

- Node.js 22 или совместимая актуальная LTS-версия
- npm

```bash
git clone https://github.com/PurpleeHead/PromptLab.git
cd PromptLab
npm ci
npm run dev
```

Откройте локальный адрес, который выведет Vite.

## Команды

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Запуск dev-сервера |
| `npm run typecheck` | Проверка TypeScript |
| `npm run lint` | Проверка ESLint |
| `npm run test:run` | Однократный запуск тестов |
| `npm run build` | Проверка типов и production-сборка |
| `npm run preview` | Локальный просмотр production-сборки |

## Данные и приватность

- Промпты, коллекции, настройки и обратная связь хранятся в `localStorage` текущего браузера.
- Локальные данные не являются облачной резервной копией и могут быть потеряны при очистке данных браузера или потере устройства.
- Для полной резервной копии рабочего пространства используйте JSON. CSV удобен для табличного экспорта, но не сохраняет все связи и историю.
- Обратная связь в текущей реализации хранится локально и не отправляется разработчику.
- Не сохраняйте в промптах пароли, API-ключи и другие секреты.
- Интеграция с Supabase необязательна. Код авторизации и интеграции присутствует, но автоматическая синхронизация и законченный облачный backup пока недоступны.

## Публикация на GitHub Pages

В репозитории есть GitHub Actions workflow, который устанавливает зависимости, запускает проверки, собирает приложение с базовым путём `/PromptLab/` и публикует папку `dist` при push в ветку `main`.

Чтобы включить публикацию:

1. Откройте **Settings → Pages**.
2. В разделе **Build and deployment → Source** выберите **GitHub Actions**.
3. Отправьте изменения в `main` или запустите **Actions → Deploy to GitHub Pages → Run workflow**.
4. Дождитесь успешного завершения workflow и откройте ссылку на демо в начале README.

Пока workflow не завершился успешно, демо нельзя считать опубликованным. Если первая сборка завершится ошибкой, откройте соответствующий запуск в Actions и проверьте шаг, на котором возникла проблема.

## Текущие ограничения

- Приложение управляет шаблонами промптов, но не вызывает AI-модель и не генерирует ответы.
- Авторизация и синхронизация через облако пока не являются полностью реализованной и проверенной функцией; используйте приложение как локальное рабочее пространство.
- В коде есть словари локализации, но перевод всех экранов интерфейса ещё не завершён. Основной язык текущего интерфейса — английский.
- Автоматизированный end-to-end набор браузерных тестов пока не настроен.
- Лицензия проекта ещё не выбрана. До добавления лицензии права остаются у правообладателя.
