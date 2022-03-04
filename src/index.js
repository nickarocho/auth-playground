import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "@aws-amplify/ui-react/styles.css"; // default theme
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { Amplify } from "aws-amplify";
import awsExports from "./aws-exports";
import { AmplifyProvider } from "@aws-amplify/ui-react";

Amplify.configure(awsExports);
// Amplify.Logger.LOG_LEVEL = "DEBUG";

ReactDOM.render(
  <React.StrictMode>
    <AmplifyProvider>
      <App />
    </AmplifyProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
