import {MaxUint256, Zero} from '@ethersproject/constants';
import {parseUnits} from '@ethersproject/units';
import {Web3Button} from '@web3modal/react';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useAccount} from 'wagmi';

import {
  useErc20Allowance,
  useErc20BalanceOf,
  useErc20Decimals,
  useErc20Write,
  useHyperbitcoinizationRead,
  useHyperbitcoinizationWrite,
  usePrepareErc20Approve,
  usePrepareHyperbitcoinizationWrite,
} from './abis/types/generated';

enum BetSides {
  WBTC = 'WBTC',
  USDC = 'USDC',
}

const HYPERBITCOINIZATION_ADDRESS = '0x99Ce4AA0dF3A96eCec203cf4F36BAc0A54122eAf';
const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

const Timer = (endTimestamp: number) => {
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date().getTime());
  const [days, setDays] = useState('00');
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  useEffect(() => {
    const diff = endTimestamp - currentTimestamp;
    if (diff < 0) {
      setSeconds('00');
      setMinutes('00');
      setHours('00');
      setDays('00');
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setSeconds(seconds < 10 ? `0${seconds}` : seconds.toString());
    setMinutes(minutes < 10 ? `0${minutes}` : minutes.toString());
    setHours(hours < 10 ? `0${hours}` : hours.toString());
    setDays(days < 10 ? `0${days}` : days.toString());
  }, [endTimestamp, currentTimestamp]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTimestamp((prev) => prev + 1000), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <h2 className="text-3xl font-bold text-center mt-2 text-dark-gray-2">
      {endTimestamp ? `${days}:${hours}:${minutes}:${seconds}` : ''}
    </h2>
  );
};

function BitcoinWarning() {
  return (
    <div className="bg-yellow-200 text-yellow-800 p-4 rounded mb-4">
      <p className="font-bold mb-2">Notice:</p>
      <p className="text-sm">
        If you believe in Bitcoin and want to save your money or make some profit, just buy Bitcoin. This is just a bet
        and our main purpose is to raise awareness and ring the alarm bell.
      </p>
    </div>
  );
}

function Description(betSide: BetSides | null, betAmount: string | null) {
  return betSide === BetSides.WBTC ? (
    <div className="bg-green-200 text-green-800 shadow-md rounded p-4 my-4">
      <p className="text-gray-700 text-sm mb-2">
        If you deposit {betAmount || 'X'} USDC, you will get{' '}
        {betAmount ? parseFloat(betAmount) / 1000000 : 'X / 1000000'} BTC and {betAmount || 'X'} USDC if the BTC price
        reaches 1m USDC in 90 days, and you will get nothing otherwise
      </p>
      <p className="text-gray-700 text-sm">
        Note: if there {"isn't"} enough amount of WBTC to fill your bet after the bet is settled in the contract, you
        can withdraw your extra USDC amount.
      </p>
    </div>
  ) : (
    <div className="bg-green-200 text-green-800 shadow-md rounded p-4 my-4">
      <p className="text-gray-700 text-sm mb-2">
        If you deposit {betAmount || 'X'} WBTC, you will get{' '}
        {betAmount ? parseFloat(betAmount) * 1000000 : 'X * 1000000'} USDC and {betAmount || 'X'} WBTC if the BTC price
        does not reach 1m USDC in 90 days, and you will get nothing otherwise
      </p>
      <p className="text-gray-700 text-sm">
        Note: if there {"isn't"} enough amount of USDC to fill your bet after the bet is settled in the contract, you
        can withdraw your extra WBTC amount.
      </p>
    </div>
  );
}

function BetBox() {
  const {data: totalUSDC} = useHyperbitcoinizationRead({
    address: HYPERBITCOINIZATION_ADDRESS,
    functionName: 'usdcTotalDeposits',
  });
  const {data: totalWBTC} = useHyperbitcoinizationRead({
    address: HYPERBITCOINIZATION_ADDRESS,
    functionName: 'btcTotalDeposits',
  });

  const [betAmount, setBetAmount] = useState('');
  const [betSide, setBetSide] = useState<BetSides | null>(null);

  const {data: decimals} = useErc20Decimals({
    address: betSide === BetSides.WBTC ? USDC_ADDRESS : WBTC_ADDRESS,
  });

  const parsedBetAmount = useMemo(() => {
    if (!betAmount || !decimals) return Zero;
    return parseUnits(betAmount, decimals);
  }, [betAmount, decimals]);

  const {address} = useAccount();
  const {data: balance} = useErc20BalanceOf({
    address: betSide === BetSides.WBTC ? USDC_ADDRESS : WBTC_ADDRESS,
    args: address ? [address] : undefined,
  });
  const {data: allowance} = useErc20Allowance({
    address: betSide === BetSides.WBTC ? USDC_ADDRESS : WBTC_ADDRESS,
    args: address ? [address, HYPERBITCOINIZATION_ADDRESS] : undefined,
  });
  const {config: approveConfig} = usePrepareErc20Approve({
    address: betSide === BetSides.WBTC ? USDC_ADDRESS : WBTC_ADDRESS,
    args: [HYPERBITCOINIZATION_ADDRESS, MaxUint256],
  });
  const {write: approve, isLoading: isLoadingApproval} = useErc20Write(approveConfig);

  const {config: depositConfig} = usePrepareHyperbitcoinizationWrite({
    address: HYPERBITCOINIZATION_ADDRESS,
    functionName: betSide === BetSides.WBTC ? 'depositUsdc' : 'depositBtc',
    args: [parsedBetAmount],
  });
  const {write: deposit, isLoading: isLoadingDeposit} = useHyperbitcoinizationWrite(depositConfig);

  const insufficientBalance = useMemo(() => {
    if (!balance || !(parsedBetAmount && !parsedBetAmount.isZero())) return false;
    return balance.sub(parsedBetAmount).lte(Zero);
  }, [balance, parsedBetAmount]);

  const needsApproval = useMemo(() => {
    if (!allowance || !(parsedBetAmount && !parsedBetAmount.isZero())) return false;
    return parsedBetAmount.sub(allowance).gte(Zero);
  }, [allowance, parsedBetAmount]);

  const buttonText = useMemo(() => {
    if (insufficientBalance) {
      return 'Insufficient Balance';
    }
    if (needsApproval) {
      return 'Approve ' + (betSide === BetSides.WBTC ? 'USDC' : 'WBTC');
    }
    return 'Place Bet';
  }, [betSide, insufficientBalance, needsApproval]);

  const placeBetDisabled = useMemo(
    () =>
      !betSide ||
      (!needsApproval && !deposit) ||
      !(parsedBetAmount && !parsedBetAmount.isZero()) ||
      isLoadingDeposit ||
      isLoadingApproval ||
      insufficientBalance,
    [betSide, deposit, insufficientBalance, isLoadingApproval, isLoadingDeposit, needsApproval, parsedBetAmount],
  );

  const handlePlaceBet = useCallback(async () => {
    if (placeBetDisabled) return;
    if (needsApproval) {
      approve?.();
    } else {
      deposit?.();
    }
  }, [approve, deposit, needsApproval, placeBetDisabled]);

  return (
    <div className="flex justify-center mb-8">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded px-8 py-8 mb-4">
          {address && (
            <div className="flex justify-center mb-2">
              <Web3Button/>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Do you think Balaji's prediction will come
              true?</label>
            <div className="flex">
              <button
                className={`w-1/2 mr-2 px-4 py-2 text-sm font-bold rounded border ${
                  betSide === BetSides.WBTC
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-blue-500 border-blue-500 hover:bg-blue-100'
                }`}
                onClick={() => setBetSide(BetSides.WBTC)}
              >
                Yes
              </button>
              <button
                className={`w-1/2 ml-2 px-4 py-2 text-sm font-bold rounded border ${
                  betSide === BetSides.USDC
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-blue-500 border-blue-500 hover:bg-blue-100'
                }`}
                onClick={() => setBetSide(BetSides.USDC)}
              >
                No
              </button>
            </div>
          </div>
          {betSide === BetSides.WBTC && <BitcoinWarning/>}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="betAmount">
              Bet Amount (in {betSide === BetSides.WBTC ? 'USDC' : 'WBTC'}):
            </label>
            <input
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                !betSide ? 'disabled opacity-50 cursor-not-allowed' : ''
              }`}
              id="betAmount"
              type="number"
              disabled={!betSide}
              step="0.00000001"
              placeholder="Enter bet amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
          </div>
          {Description(betSide, betAmount)}
          <div className="flex items-center justify-center">
            {
              address ? (
                <button
                  className={`bg-blue-500 text-white font-bold py-2 px-4 rounded ${
                    placeBetDisabled
                      ? 'disabled opacity-50 cursor-not-allowed'
                      : 'hover:bg-blue-700 focus:outline-none focus:shadow-outline'
                  }`}
                  type="button"
                  disabled={placeBetDisabled}
                  onClick={handlePlaceBet}
                >
                  {buttonText}
                </button>
              ) : (
                <Web3Button/>
              )
            }
          </div>
          <div className="mt-3">
            <div className="text-center font-xl font-semibold text-gray-600">
              Total Deposited USDC: {totalUSDC ? String(totalUSDC) : '...'}
            </div>
            <div className="text-center font-xl font-semibold text-gray-600">
              Total Deposited WBTC: {totalWBTC ? String(totalWBTC) : '...'}
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <a
              href={`https://etherscan.io/address/${HYPERBITCOINIZATION_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-2 text-sm text-blue-600"
            >
              View Contract
            </a>
            <span className="text-sm">|</span>
            <a
              href="https://github.com/hyperbitcoinization"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const {data: endTimestampFromContract} = useHyperbitcoinizationRead({
    address: HYPERBITCOINIZATION_ADDRESS,
    functionName: 'endTimestamp',
  });
  const endTimestamp = useMemo(() => {
    return endTimestampFromContract ? (endTimestampFromContract.toNumber() * 1000) : 0;
  }, [endTimestampFromContract]);
  return (
    <>
      <div className="container mx-auto my-4" style={{maxWidth: '1200px'}}>
        <div className="text-center my-8 px-4">
          <h2 className="text-large font-semibold mb-4">As some of you may know, <a
            className="underline text-blue-600"
            href="https://balajis.com/about/"
            target="_blank"
            rel="noreferrer"
          >Balaji</a> made a <a
            className="underline text-blue-600"
            href="https://twitter.com/balajis/status/1636797265317867520"
            target="_blank"
            rel="noreferrer"
          >crazy sounding
            prediction</a> that
          </h2>
          <h1 className="text-4xl font-bold mb-4">We're heading for hyperinflation and Bitcoin will reach $1M in</h1>
          {Timer(endTimestamp)}
          <h2 className="text-base font-semibold my-4">Whether you agree with him or not, if you're willing to put your
            money
            where your mouth is and bet on it, we got you.</h2>
        </div>
        <div className={'flex justify-around flex-wrap'}>
          <BetBox/>
          <blockquote className="twitter-tweet">
            <p lang="en" dir="ltr">
              The three scariest words in the English language:
              <br/>
              <br/>
              “Balaji was right.” <a href="https://t.co/hW3hAvKm4C">https://t.co/hW3hAvKm4C</a>
            </p>
            &mdash; Ryan Selkis 🥷 (@twobitidiot){' '}
            <a href="https://twitter.com/twobitidiot/status/1636875413610803201?ref_src=twsrc%5Etfw">March 17, 2023</a>
          </blockquote>
        </div>
      </div>
    </>
  );
}

export default App;
