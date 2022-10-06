import React, { useEffect, useState, type FC } from "react";
import { Text } from "ink";
import spinners, { type SpinnerName } from "cli-spinners";

interface Props {
  type?: SpinnerName;
}

const Spinner: FC<Props> = ({ type = "dots" }) => {
  const [frame, setFrame] = useState(0);
  const spinner = spinners[type];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((previousFrame) => {
        const isLastFrame = previousFrame === spinner.frames.length - 1;
        return isLastFrame ? 0 : previousFrame + 1;
      });
    }, spinner.interval);

    return () => {
      clearInterval(timer);
    };
  }, [spinner]);

  return <Text>{spinner.frames[frame]}</Text>;
};

export default Spinner;
