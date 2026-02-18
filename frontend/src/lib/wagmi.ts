import { http, createConfig } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

export const config = createConfig({
    chains: [bscTestnet],
    connectors: [injected(), metaMask()],
    transports: {
        [bscTestnet.id]: http("https://data-seed-prebsc-1-s1.binance.org:8545"),
    },
    ssr: true,
});
