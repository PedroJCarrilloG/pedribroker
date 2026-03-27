import { useState, useEffect } from 'react';

export default function App() {
  const [price, setPrice] = useState(0);
  const [asset, setAsset] = useState('btcusdt');
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [mounted, setMounted] = useState(false); // <--- Paso 1: Control de hidratación
  const [portfolio] = useState([
    { asset: 'BTC', amount: 0.5, entry: 30000 }
  ]);

  // Aseguramos que solo renderice tras montar en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // REAL-TIME PRICE
  useEffect(() => {
    if (!mounted) return;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${asset}@trade`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.p) setPrice(parseFloat(data.p));
    };
    return () => ws.close();
  }, [asset, mounted]);

  // ORDER BOOK
  useEffect(() => {
    if (!mounted) return;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${asset}@depth5`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOrderBook({ bids: data.bids || [], asks: data.asks || [] });
    };
    return () => ws.close();
  }, [asset, mounted]);

  const calculatePnL = (pos) => {
    if (price === 0) return "0.00";
    const pnl = (price - pos.entry) * pos.amount;
    return pnl.toFixed(2);
  };

  // Si no está montado, mostramos un loader o nada para evitar el error de Vercel
  if (!mounted) return <div className="bg-[#0b0e11] h-screen" />;

  return (
    <div className="h-screen bg-[#0b0e11] text-white grid grid-cols-[1fr] md:grid-cols-[250px_1fr_300px] grid-rows-[60px_1fr]">
      {/* HEADER */}
      <div className="col-span-1 md:col-span-3 flex items-center justify-between px-4 border-b border-gray-800">
        <h1 className="text-green-400 text-xl font-bold">PedriBroker</h1>
        <div className="text-lg uppercase font-mono">
          {asset} <span className={price > 0 ? "text-yellow-400" : ""}>${price > 0 ? price.toLocaleString() : '---'}</span>
        </div>
      </div>

      {/* WATCHLIST */}
      <div className="hidden md:block border-r border-gray-800 p-3 overflow-y-auto">
        {["btcusdt", "ethusdt", "bnbusdt", "solusdt"].map((a) => (
          <div
            key={a}
            className={`p-2 hover:bg-gray-800 cursor-pointer rounded ${asset === a ? 'bg-gray-800' : ''}`}
            onClick={() => setAsset(a)}
          >
            {a.toUpperCase()}
          </div>
        ))}
      </div>

      {/* MULTI CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-1 bg-black">
        {[1, 2, 3, 4].map((i) => (
          <iframe
            key={i}
            src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${asset.toUpperCase()}&interval=60&theme=dark`}
            className="w-full h-full border-none opacity-80 hover:opacity-100 transition-opacity"
          />
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div className="border-l border-gray-800 p-2 overflow-y-auto font-mono text-xs">
        <h3 className="mb-2 text-gray-400 border-b border-gray-800 pb-1">ORDER BOOK</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <h4 className="text-green-400 mb-1">Bids</h4>
            {orderBook.bids?.map((b, i) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="text-green-500">{parseFloat(b[0]).toFixed(2)}</span>
                <span className="text-gray-500">{parseFloat(b[1]).toFixed(3)}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-red-400 mb-1">Asks</h4>
            {orderBook.asks?.map((a, i) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="text-red-500">{parseFloat(a[0]).toFixed(2)}</span>
                <span className="text-gray-500">{parseFloat(a[1]).toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PORTFOLIO */}
        <h3 className="mt-6 text-gray-400 border-b border-gray-800 pb-1">PORTFOLIO</h3>
        {portfolio.map((p, i) => {
          const pnl = calculatePnL(p);
          return (
            <div key={i} className="mt-2 p-2 bg-gray-900 rounded">
              <div className="flex justify-between">
                <span>{p.asset}</span>
                <span>{p.amount} units</span>
              </div>
              <div className={parseFloat(pnl) >= 0 ? 'text-green-400' : 'text-red-400'}>
                PnL: ${pnl}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
