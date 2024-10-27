import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import "./style.css";

function App() {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              QuillJS + Dynamic Variable Demo
            </Typography>
          </Toolbar>
        </AppBar>
        <Container
          sx={{
            minHeight: 0,
            minWidth: "100vw",
            flexGrow: 1,
            backgroundColor: "#f1f6eb",
          }}
        ></Container>
      </Box>
    </>
  );
}

export default App;
