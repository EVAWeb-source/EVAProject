'use client';

import styles from './FilterMenu.module.css';

export type FilterOption = {
  value: string;
  label: string;
  note?: string;
};

export default function FilterMenu({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <details className={styles.menu}>
      <summary className={styles.trigger}>
        <span className={styles.label}>{label}</span>
        <strong>{current?.label}</strong>
        <i aria-hidden="true">⌄</i>
      </summary>

      <div className={styles.panel} role="menu" aria-label={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              type="button"
              key={option.value}
              className={selected ? styles.option + ' ' + styles.selected : styles.option}
              onClick={(event) => {
                onChange(option.value);
                (event.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');
              }}
              role="menuitemradio"
              aria-checked={selected}
            >
              <span>
                <b>{option.label}</b>
                {option.note ? <small>{option.note}</small> : null}
              </span>
              <i aria-hidden="true">{selected ? '✓' : ''}</i>
            </button>
          );
        })}
      </div>
    </details>
  );
}
