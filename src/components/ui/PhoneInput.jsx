import { COUNTRY_CODES, combinePhoneWithDialCode, parsePhoneWithDialCode } from '@/utils/countryCodes';

/**
 * Country flag + dial code selector with local number field.
 */
export function PhoneInput({ label, value, onChange, className = '' }) {
  const { dialCode, localNumber } = parsePhoneWithDialCode(value);

  const update = (nextDial, nextLocal) => {
    onChange?.(combinePhoneWithDialCode(nextDial, nextLocal));
  };

  return (
    <div className={className}>
      {label ? (
        <label className="text-sm font-medium text-[var(--color-primary)] block mb-1">{label}</label>
      ) : null}
      <div className="flex gap-2">
        <select
          value={dialCode}
          onChange={(e) => update(e.target.value, localNumber)}
          className="w-[140px] shrink-0 px-2 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white text-sm"
          aria-label="Country code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.dial}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={localNumber}
          onChange={(e) => update(dialCode, e.target.value)}
          placeholder="Phone number"
          className="flex-1 min-w-0 px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white"
        />
      </div>
    </div>
  );
}
