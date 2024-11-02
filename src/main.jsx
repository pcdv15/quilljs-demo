import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { createTheme, ThemeProvider } from "@mui/material/styles";

export const themeOptions = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3f51b5",
    },
    secondary: {
      main: "#f50057",
    },
  },
});

createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={themeOptions}>
    <App />
  </ThemeProvider>
);
