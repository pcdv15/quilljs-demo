import { useRef, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Grid,
  Toolbar,
  Typography,
} from "@mui/material";
import "./styles/style.css";
import QuillEditor from "./QuillEditor";
import { quillConfig } from "./constants";

function App() {
  const editorRef = useRef();
  const [innerHtml, setInnerHtml] = useState();

  const testVars = [
    {
      marker: "{{Test Variable 1}}",
      title: "Test Variable 1",
    },
    {
      marker: "{{Test Variable 2}}",
      title: "Test Variable 2",
    },
  ];

  const handleInsertVariable = (variable) => {
    const quill = editorRef.current;
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        quill.insertText(range.index, variable);
      }
    }
  };

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
              QuillJS + Dynamic Variable Tag Demo
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
        >
          <Grid container spacing={2} mt={2} sx={{ padding: 4 }}>
            <Grid item xs={12} md={8}>
              <Box
                id="quill-editor"
                sx={{ minHeight: "50vh", maxHeight: "50vh", maxWidth: "100%" }}
              >
                <QuillEditor
                  defaultValue={"Hello {{user}} "}
                  config={quillConfig}
                  ref={editorRef}
                  setInnerHtml={setInnerHtml}
                />
              </Box>
              <Grid mt={2}>
                <Box>Test HTML Output: {innerHtml}</Box>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4} sx={{ height: "100%" }}>
              <Typography variant="h4" sx={{ mb: 2 }}>
                Test Variables
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  mb: 2,
                }}
              >
                {testVars.map((testVar, index) => (
                  <Button
                    key={index}
                    variant="contained"
                    disableElevation={true}
                    sx={{
                      textTransform: "none",
                    }}
                    onClick={() => handleInsertVariable(testVar.marker)}
                  >
                    {testVar.title}
                  </Button>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}

export default App;
