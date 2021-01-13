import Adapter from "../../src/adapter/adapter";
import { SerialPortOptions } from "../../src/adapter/tstype";

const createAdapter = (adapter: SerialPortOptions['adapter']) => Adapter.create({
  panID: 0x1a63,
  channelList: [15],
}, {
  baudRate: 115200,
  rtscts: true,
  path: '/dummy/conbee',
  adapter
}, 'backupPath', {});

afterEach(jest.clearAllMocks);


test('custom adapter is instantiated when passed as an option on creation', async () => {
  const myAdapter = jest.fn().mockImplementation(() => () => ({}));

  await createAdapter(myAdapter as unknown as typeof Adapter);

  expect(myAdapter).toHaveBeenCalledTimes(1);
})
