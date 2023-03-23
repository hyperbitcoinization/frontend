import { defineConfig } from '@wagmi/cli';
import { react } from '@wagmi/cli/plugins';
import { erc20ABI } from 'wagmi';

import HyperbitcoinizationABI from './src/abis/hyperbitcoinization';

export default defineConfig({
  out: 'src/abis/types/generated.ts',
  contracts: [
    {
      name: 'erc20',
      abi: erc20ABI,
    },
    {
      name: 'Hyperbitcoinization',
      abi: HyperbitcoinizationABI,
    },
  ],
  plugins: [react()],
});
