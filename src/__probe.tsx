import * as React from "react";
import { createRootRoute } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

function A({ error, reset }: ErrorComponentProps) {
  void error;
  void reset;
  return <div />;
}

function B({ error, reset }: { error: Error; reset: () => void }) {
  void error;
  void reset;
  return <div />;
}

const C = Object.assign(
  function CInner({ error, reset }: ErrorComponentProps) {
    void error;
    void reset;
    return <div />;
  },
  { preload: () => Promise.resolve() },
);

const D = React.lazy(async () => ({ default: B }));

createRootRoute({ errorComponent: A });
createRootRoute({ errorComponent: B });
createRootRoute({ errorComponent: C });
createRootRoute({ errorComponent: D });
