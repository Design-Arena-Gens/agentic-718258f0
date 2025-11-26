'use client';

import { all, create, MathType } from "mathjs";
import { useMemo, useState } from "react";

type AngleMode = "RAD" | "DEG";

const math = create(all, {});

const formatResult = (value: MathType) => {
  try {
    const formatted = math.format(value, {
      precision: 14,
    });
    return formatted;
  } catch {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toString();
    }
    return "Error";
  }
};

type CalculatorButton = {
  label: string;
  value?: string;
  type?: "command" | "eval" | "append";
};

const BUTTON_LAYOUT: CalculatorButton[][] = [
  [
    { label: "AC", type: "command" },
    { label: "DEL", type: "command" },
    { label: "(", value: "(", type: "append" },
    { label: ")", value: ")", type: "append" },
  ],
  [
    { label: "sin", value: "sin(", type: "append" },
    { label: "cos", value: "cos(", type: "append" },
    { label: "tan", value: "tan(", type: "append" },
    { label: "x!", value: "!", type: "append" },
  ],
  [
    { label: "ln", value: "ln(", type: "append" },
    { label: "log", value: "log(", type: "append" },
    { label: "√", value: "sqrt(", type: "append" },
    { label: "x^y", value: "^", type: "append" },
  ],
  [
    { label: "7", value: "7", type: "append" },
    { label: "8", value: "8", type: "append" },
    { label: "9", value: "9", type: "append" },
    { label: "÷", value: "/", type: "append" },
  ],
  [
    { label: "4", value: "4", type: "append" },
    { label: "5", value: "5", type: "append" },
    { label: "6", value: "6", type: "append" },
    { label: "×", value: "*", type: "append" },
  ],
  [
    { label: "1", value: "1", type: "append" },
    { label: "2", value: "2", type: "append" },
    { label: "3", value: "3", type: "append" },
    { label: "-", value: "-", type: "append" },
  ],
  [
    { label: "0", value: "0", type: "append" },
    { label: ".", value: ".", type: "append" },
    { label: "π", value: "pi", type: "append" },
    { label: "+", value: "+", type: "append" },
  ],
  [
    { label: "Ans", type: "command" },
    { label: "EXP", value: "E", type: "append" },
    { label: "%", value: "%", type: "append" },
    { label: "=", type: "eval" },
  ],
];

export default function Home() {
  const [expression, setExpression] = useState("0");
  const [result, setResult] = useState("0");
  const [lastAnswer, setLastAnswer] = useState("0");
  const [angleMode, setAngleMode] = useState<AngleMode>("RAD");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<{ expr: string; value: string }[]>([]);

  const scope = useMemo(() => {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const fromRadians = (value: number) => (value * 180) / Math.PI;

    return {
      sin: (value: number) =>
        Math.sin(angleMode === "DEG" ? toRadians(value) : value),
      cos: (value: number) =>
        Math.cos(angleMode === "DEG" ? toRadians(value) : value),
      tan: (value: number) =>
        Math.tan(angleMode === "DEG" ? toRadians(value) : value),
      asin: (value: number) =>
        angleMode === "DEG" ? fromRadians(Math.asin(value)) : Math.asin(value),
      acos: (value: number) =>
        angleMode === "DEG" ? fromRadians(Math.acos(value)) : Math.acos(value),
      atan: (value: number) =>
        angleMode === "DEG" ? fromRadians(Math.atan(value)) : Math.atan(value),
      ln: (value: number) => Math.log(value),
      log: (value: number, base?: number) => {
        if (typeof base === "number") {
          return Math.log(value) / Math.log(base);
        }
        return Math.log10(value);
      },
      sqrt: (value: number) => Math.sqrt(value),
      Ans: Number(lastAnswer),
    };
  }, [angleMode, lastAnswer]);

  const resetCalculator = () => {
    setExpression("0");
    setResult("0");
    setErrorMessage(null);
  };

  const deleteLast = () => {
    setErrorMessage(null);
    setExpression((prev) => {
      if (prev.length <= 1) {
        return "0";
      }
      return prev.slice(0, -1);
    });
  };

  const appendToken = (token: string) => {
    setErrorMessage(null);
    setExpression((prev) => {
      if (prev === "0") {
        if (
          /^[0-9.]$/.test(token) ||
          token === "pi" ||
          token === "E" ||
          token === "Ans"
        ) {
          return token;
        }
        if (token === "-" || token.endsWith("(")) {
          return token;
        }
        return prev + token;
      }

      if (token === "!" && /[+\-*/^%]$/.test(prev)) {
        return prev;
      }

      if (token === "." && /\.\d*$/.test(prev.split(/[+\-*/^()%]/).pop() ?? "")) {
        return prev;
      }

      return prev + token;
    });
  };

  const handleEvaluate = () => {
    try {
      const sanitizedExpression = expression
        .replace(/%/g, "*(1/100)")
        .replace(/Ans/g, `(${lastAnswer})`);

      const evaluation = math.evaluate(sanitizedExpression, scope);
      const formatted = formatResult(evaluation);

      if (formatted === "Error" || formatted === "NaN") {
        throw new Error("Invalid computation");
      }

      setResult(formatted);
      setLastAnswer(formatted);
      setHistory((prev) => [
        { expr: expression, value: formatted },
        ...prev.slice(0, 9),
      ]);
      setExpression(formatted);
      setErrorMessage(null);
    } catch {
      setErrorMessage("Invalid expression");
    }
  };

  const handleCommand = (label: string) => {
    switch (label) {
      case "AC":
        resetCalculator();
        break;
      case "DEL":
        deleteLast();
        break;
      case "Ans":
        appendToken(lastAnswer);
        break;
      default:
        break;
    }
  };

  const handleButtonClick = (button: CalculatorButton) => {
    if (button.type === "command") {
      handleCommand(button.label);
      return;
    }

    if (button.type === "eval") {
      handleEvaluate();
      return;
    }

    if (button.value) {
      appendToken(button.value);
    }
  };

  const toggleAngleMode = () => {
    setAngleMode((prev) => (prev === "RAD" ? "DEG" : "RAD"));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="flex items-start justify-between rounded-t-3xl bg-slate-900 p-6 text-white">
            <div className="space-y-4">
              <div className="min-h-[48px] text-right text-2xl font-light tracking-tight text-slate-200">
                {expression || "0"}
              </div>
              <div className="text-4xl font-semibold tracking-tight">
                {errorMessage ? "Error" : result}
              </div>
            </div>
            <button
              onClick={toggleAngleMode}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:text-white"
            >
              {angleMode}
            </button>
          </div>

          {errorMessage ? (
            <div className="px-6 py-3 text-sm font-medium text-rose-500">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-4 gap-3 p-6">
            {BUTTON_LAYOUT.flat().map((button) => (
              <button
                key={button.label}
                onClick={() => handleButtonClick(button)}
                className={`rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-lg font-semibold text-slate-800 shadow-inner transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg active:translate-y-0 ${
                  button.type === "command"
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : ""
                } ${
                  button.type === "eval"
                    ? "col-span-1 bg-slate-900 text-white hover:bg-slate-800"
                    : ""
                } ${
                  button.label === "0" ? "col-span-1" : ""
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
        </section>

        <aside className="flex h-full flex-col gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-900">
              Calculation History
            </h2>
            <p className="text-sm text-slate-500">
              Tap a record to reuse its result.
            </p>
            <div className="mt-4 flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-2 text-sm">
              {history.length === 0 ? (
                <p className="text-slate-400">Nothing yet. Start calculating.</p>
              ) : (
                history.map((item, index) => (
                  <button
                    key={`${item.expr}-${index}`}
                    onClick={() => {
                      setExpression(item.value);
                      setResult(item.value);
                    }}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      {item.expr}
                    </span>
                    <span className="text-lg font-semibold text-slate-900">
                      {item.value}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 shadow-sm shadow-slate-200/40">
            <h2 className="text-lg font-semibold text-slate-900">
              Scientific Mode
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Supports trigonometric, logarithmic, and factorial ops.</li>
              <li>• Toggle between radians and degrees instantly.</li>
              <li>• History keeps your last ten evaluations.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
