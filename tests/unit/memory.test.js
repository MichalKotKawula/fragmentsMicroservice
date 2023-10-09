const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory/index');

describe('Memory Database Tests', () => {
  const testFragment = {
    ownerId: 'testOwner',
    id: 'testFragmentId',
    data: 'Sample metadata',
  };

  // eslint-disable-next-line no-undef
  const testDataBuffer = Buffer.from('This is test data.');

  beforeEach(async () => {
    // Assuming MemoryDB starts fresh each time it's instantiated
  });

  test('writeFragment and readFragment', async () => {
    await writeFragment(testFragment);
    const retrievedFragment = await readFragment(testFragment.ownerId, testFragment.id);
    expect(retrievedFragment).toEqual(testFragment);
  });

  test('writeFragmentData and readFragmentData', async () => {
    await writeFragmentData(testFragment.ownerId, testFragment.id, testDataBuffer);
    const retrievedData = await readFragmentData(testFragment.ownerId, testFragment.id);
    expect(retrievedData).toEqual(testDataBuffer);
  });

  test('listFragments without expand', async () => {
    await writeFragment(testFragment);
    const fragmentsList = await listFragments(testFragment.ownerId);
    expect(fragmentsList).toEqual([testFragment.id]);
  });

  test('listFragments with expand', async () => {
    await writeFragment(testFragment);
    const expandedFragmentsList = await listFragments(testFragment.ownerId, true);
    expect(expandedFragmentsList).toEqual([testFragment]);
  });

  test('deleteFragment', async () => {
    await writeFragment(testFragment);
    await writeFragmentData(testFragment.ownerId, testFragment.id, testDataBuffer);

    await deleteFragment(testFragment.ownerId, testFragment.id);

    const afterDeleteFragment = await readFragment(testFragment.ownerId, testFragment.id);
    const afterDeleteData = await readFragmentData(testFragment.ownerId, testFragment.id);

    expect(afterDeleteFragment).toBeUndefined();
    expect(afterDeleteData).toBeUndefined();
  });
});
