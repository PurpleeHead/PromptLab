import type { Locale } from '../i18n';
import { useTranslation } from '../i18n';

export function LocaleSwitch({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  const { t } = useTranslation(locale);

  return (
    <div className="locale-switch" role="group" aria-label={t('locale.switchAria')}>
      {(['en', 'ru'] as const).map((option) => (
        <button
          key={option}
          type="button"
          className={locale === option ? 'selected' : ''}
          aria-label={t(option === 'en' ? 'locale.en' : 'locale.ru')}
          aria-pressed={locale === option}
          onClick={() => onChange(option)}
        >
          {t(option === 'en' ? 'locale.flag.en' : 'locale.flag.ru')}
        </button>
      ))}
    </div>
  );
}
