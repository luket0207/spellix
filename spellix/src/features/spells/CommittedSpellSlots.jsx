import CommittedSpellSlotList from '../../components/spells/CommittedSpellSlotList';

function CommittedSpellSlots({
  language,
  mergedColumns = [],
  spellSlots,
  title = 'Spells',
  titleClassName = '',
}) {
  return (
    <CommittedSpellSlotList
      language={language}
      mergedColumns={mergedColumns}
      spellSlots={spellSlots}
      title={title}
      titleClassName={titleClassName}
    />
  );
}

export default CommittedSpellSlots;
