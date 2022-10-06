import fs from "node:fs";
import { exec } from "node:child_process";
import React, { useEffect, useMemo, useState } from "react";
import { Box, render, Text, useApp, useInput } from "ink";
import { UncontrolledTextInput } from "ink-text-input";
import { atom, useAtom, useAtomValue } from "jotai";
import randomWords from "random-words";
import Spinner from "./Spinner.js";

const dataAtom = atom({
  step: 0,
  projectName: "",
  template: null as { label: string; value: string } | null,
  error: null as string | null,
});

const ProjectNameInput = () => {
  const [data, setData] = useAtom(dataAtom);

  const placeholder = useMemo(() => {
    while (true) {
      const word = randomWords({ exactly: 2, join: "-" });
      if (
        !fs.existsSync(`./${word}`) ||
        (fs.lstatSync(`./${word}`).isDirectory() &&
          fs.readdirSync(`./${word}`).length === 0)
      ) {
        return word;
      }
    }
  }, []);

  return data.projectName
    ? (
      <Box>
        <Text color="green">✔</Text>
        <Text color="white">{" "}Project name:{" "}</Text>
        <Text color="white" bold>{data.projectName}</Text>
      </Box>
    )
    : (
      <Box>
        <Text color="blueBright">?</Text>
        <Text color="white">{" "}Project name:{" "}</Text>
        <UncontrolledTextInput
          placeholder={placeholder}
          onSubmit={(projectName) => {
            if (/^[a-zA-Z0-9-_]+$/.test(projectName || placeholder)) {
              setData((data) => ({
                ...data,
                step: data.step + 1,
                projectName: projectName || placeholder,
              }));
            }
          }}
        />
      </Box>
    );
};

const TemplateInput = () => {
  const [index, setIndex] = useState<number>(0);
  const [data, setData] = useAtom(dataAtom);

  const items = [{
    label: "React + Vite + Electron",
    value: "kimkanu/react-vite-electron",
  }, {
    label: "Ultrajs Starter",
    value: "kimkanu/ultrajs-starter",
  }] as const;

  useInput((_, key) => {
    if (key.return) {
      setData((data) => ({
        ...data,
        step: data.step + 1,
        template: items[index],
      }));
    } else if (key.upArrow) {
      setIndex((index) => (index + items.length - 1) % items.length);
    } else if (key.downArrow) {
      setIndex((index) => (index + 1) % items.length);
    }
  });

  return (
    data.template
      ? (
        <Box>
          <Text color="green">✔</Text>
          <Text color="white">{" "}Select a template:{" "}</Text>
          <Text color="white" bold>{data.template.label}</Text>
        </Box>
      )
      : (
        <Box flexDirection="column">
          <Box>
            <Text color="blueBright">?</Text>
            <Text color="white">{" "}Select a template:{" "}</Text>
          </Box>
          {items.map((_, i) => (
            <Box key={i}>
              <Text color="blueBright">{i === index ? "❯   " : "    "}</Text>
              <Text color="white" underline={i === index}>
                {items[i].label}
              </Text>
            </Box>
          ))}
        </Box>
      )
  );
};

const DownloadTemplate = () => {
  const [data, setData] = useAtom(dataAtom);
  const { exit } = useApp();
  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending",
  );

  useEffect(() => {
    (async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          exec("git --version", (error, stdout) => {
            if (error) {
              reject("Git is not installed!");
            } else {
              resolve();
            }
          });
        });
        await new Promise<void>((resolve, reject) => {
          exec(
            `git clone https://github.com/${
              data.template!.value
            } ${data.projectName}`,
            (error, stdout) => {
              if (error) {
                reject("Failed to fetch the template!");
              } else {
                resolve();
              }
            },
          );
        });
        await new Promise<void>((resolve, reject) => {
          exec(`rm -rf ${data.projectName}/.git`, (error, stdout) => {
            if (error) {
              reject("Failed to initialize the project!");
            } else {
              resolve();
            }
          });
        });
        setData((data) => ({
          ...data,
          step: data.step + 1,
        }));
      } catch (error) {
        setData((data) => ({
          ...data,
          error: error as string,
        }));
        setTimeout(() => {
          exit();
        }, 100);
      }
    })();
  }, []);

  return status === "pending"
    ? (
      <Text>
        <Text color="green">
          <Spinner type="dots" />
        </Text>
        {" Downloading the template..."}
      </Text>
    )
    : status === "success"
    ? (
      <Text>
        <Text color="green">✔</Text> Downloaded the template
      </Text>
    )
    : null;
};

const DoneDisplay = () => {
  const [data] = useAtom(dataAtom);
  const { exit } = useApp();

  useEffect(() => {
    exit();
  }, []);

  return (
    <Box flexDirection="column">
      <Text>
        <Text color="green">✔</Text> Done!
      </Text>
      <Text>
        Run <Text color="gray">`cd {data.projectName}`</Text>,{" "}
        <Text color="gray">`npm i`</Text>, and{" "}
        <Text color="gray">`npm run dev`</Text>!
      </Text>
    </Box>
  );
};

const ErrorDisplay = () => {
  const [data] = useAtom(dataAtom);

  return (
    <Text>
      <Text color="red">✖</Text> {data.error}
    </Text>
  );
};

const App = () => {
  const data = useAtomValue(dataAtom);

  return (
    <Box flexDirection="column">
      <ProjectNameInput />
      {data.step >= 1 && <TemplateInput />}
      {data.step >= 2 && <DownloadTemplate />}
      {data.step >= 3 && <DoneDisplay />}
      {data.error && <ErrorDisplay />}
    </Box>
  );
};

render(<App />);
