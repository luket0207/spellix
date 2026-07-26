import CommittedSpellSlotList from '../../components/spells/CommittedSpellSlotList';

function CommittedSpellSlots({
  language,
  mergedColumns = [],
  onTokenClick = null,
  showOnlyFilledSlots = false,
  spellSlots,
  title = 'Spells',
  titleClassName = '',
}) {
  return (
    <CommittedSpellSlotList
      language={language}
      mergedColumns={mergedColumns}
      onTokenClick={onTokenClick}
      showOnlyFilledSlots={showOnlyFilledSlots}
      spellSlots={spellSlots}
      title={title}
      titleClassName={titleClassName}
    />
  );
}

export default CommittedSpellSlots;
