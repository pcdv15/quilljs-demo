import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import "./style.css";

function App() {
  return (
    <>
      <Box>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              QuillJS + Dynamic Variable Demo
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
    </>
  );
}

export default App;
