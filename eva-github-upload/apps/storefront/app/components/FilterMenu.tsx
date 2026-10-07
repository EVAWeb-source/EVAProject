'use client';

import type { MouseEvent } from 'react';
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

  function closeOtherMenus(event: MouseEvent<HTMLElement>) {
    const currentMenu = event.currentTarget.closest('details');
    document.querySelectorAll<HTMLDetailsElement>('details[data-eva-filter="true"][open]').forEach((menu) => {
      if (menu !== currentMenu) menu.removeAttribute('open');
    });
  }

  return (
    <details className={styles.menu} data-eva-filter="true">
      <summary className={styles.trigger} onClick={closeOtherMenus}>
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
