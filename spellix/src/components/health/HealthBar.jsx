import './HealthBar.css';

function getSafeNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getHealthTone(healthPercent) {
  if (healthPercent > 20) {
    return 'green';
  }

  if (healthPercent > 10) {
    return 'orange';
  }

  return 'red';
}

export function getHealthBarDisplayData(currentHealth, maxHealth) {
  const safeMaxHealth = Math.max(0, getSafeNumber(maxHealth));
  const safeCurrentHealth = Math.max(0, getSafeNumber(currentHealth));
  const clampedCurrentHealth =
    safeMaxHealth > 0 ? Math.min(safeCurrentHealth, safeMaxHealth) : 0;
  const healthPercent =
    safeMaxHealth > 0 ? (clampedCurrentHealth / safeMaxHealth) * 100 : 0;

  return {
    clampedCurrentHealth,
    healthPercent,
    maxHealth: safeMaxHealth,
    tone: getHealthTone(healthPercent),
  };
}

function HealthBar({ currentHealth, maxHealth }) {
  const { clampedCurrentHealth, healthPercent, maxHealth: safeMaxHealth, tone } =
    getHealthBarDisplayData(currentHealth, maxHealth);

  return (
    <div
      aria-label="Health bar"
      aria-valuemax={safeMaxHealth}
      aria-valuemin={0}
      aria-valuenow={clampedCurrentHealth}
      className="health-bar"
      role="meter"
    >
      <div
        className={`health-bar-fill health-bar-fill--${tone}`}
        style={{ width: `${healthPercent}%` }}
      />
      <span className="health-bar-text">{`${clampedCurrentHealth} / ${safeMaxHealth}`}</span>
    </div>
  );
}

export default HealthBar;
