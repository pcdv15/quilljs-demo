/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
import { forwardRef, useEffect, useRef } from "react";
import Quill from "quill";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import "quill/dist/quill.snow.css";
import "./styles/style.css";
import { markerRegex } from "./constants";

const Delta = Quill.import("delta");

let Embed = Quill.import("blots/embed");

class TemplateMarker extends Embed {
  static create(value) {
    let node = super.create(value);

    // Set the CSS class
    node.setAttribute("class", `dynamic-variable`);
    node.setAttribute("data-marker", value.marker);
    node.setAttribute("data-title", value.title);

    node.innerHTML = value.title;

    node.setAttribute("contenteditable", "false");

    return node;
  }

  static value(node) {
    return {
      marker: node.getAttribute("data-marker"),
      title: node.getAttribute("data-title"),
    };
  }
}

TemplateMarker.blotName = "TemplateMarker";
TemplateMarker.tagName = "span";

Quill.register({
  "formats/TemplateMarker": TemplateMarker,
});

const QuillEditor = forwardRef(
  ({ config, defaultValue, setInnerHtml }, ref) => {
    const containerRef = useRef(null);

    useEffect(() => {
      const container = document.getElementById("quill-editor");
      containerRef.current = container;

      const quill = new Quill(container, {
        modules: {
          toolbar: config?.toolbar ?? false,
        },
        theme: "snow",
      });
      quill.root.setAttribute("spellcheck", false);

      ref.current = quill;

      const processMarkers = (quill, delta) => {
        const ops = delta.ops;

        const newDelta = new Delta();

        ops.forEach((op) => {
          if (typeof op.insert === "string") {
            let match;
            let lastIndex = 0;

            while ((match = markerRegex.exec(op.insert)) !== null) {
              const markerText = match[0];
              const markerName = match[1].trim();

              // Insert any text before the marker, retaining attributes/styling
              if (lastIndex < match.index) {
                newDelta.insert(
                  op.insert.slice(lastIndex, match.index),
                  op.attributes || {}
                );
              }

              newDelta.insert(
                { TemplateMarker: { marker: markerText, title: markerName } },
                "TemplateMarker"
              );

              lastIndex = match.index + markerText.length;
            }

            if (lastIndex < op.insert.length) {
              newDelta.insert(op.insert.slice(lastIndex), op.attributes || {});
            }
          } else {
            newDelta.insert(op.insert, op.attributes || {});
          }
        });

        quill.setContents(newDelta); // Update Quill with the new Delta
      };

      if (defaultValue) {
        const delta = new Delta().insert(defaultValue); // Convert HTML to Delta

        processMarkers(quill, delta);
        setInnerHtml(defaultValue);
      }

      let isHandlingChange = false; // Flag to prevent recursive text change handling

      quill.on(Quill.events.TEXT_CHANGE, () => {
        if (isHandlingChange) return;

        isHandlingChange = true; // Set the flag to prevent recursion

        const delta = quill.getContents();
        const ops = delta.ops;

        // Store the current selection position before making changes
        const originalSelection = quill.getSelection();
        let newCursorPos = originalSelection ? originalSelection.index : null;
        let currentIndex = 0;

        ops.forEach((op) => {
          // Only process plain text, skip existing markers (embedded objects)
          if (typeof op.insert === "string") {
            let match;
            while ((match = markerRegex.exec(op.insert)) !== null) {
              const markerName = match[0];
              const startIndex = currentIndex + match.index;

              // Replace the plain marker text with a TemplateMarker

              quill.deleteText(
                startIndex,
                markerName.length,
                Quill.sources.SILENT
              ); // Use SILENT to avoid triggering TEXT_CHANGE again

              // Insert the TemplateMarker silently and add an extra space
              quill.insertEmbed(
                startIndex,
                "TemplateMarker",
                {
                  marker: markerName,
                  title: markerName.replace(/[{}]/g, "").trim(),
                },
                Quill.sources.SILENT
              );

              // Add a space after the marker to separate it from other text
              quill.insertText(startIndex + 1, " ", Quill.sources.SILENT);

              // Update the cursor position to the end of this new marker
              newCursorPos = startIndex + 2;
            }
          }

          currentIndex += op.insert.length || 1; // Update current index position for non-string inserts
        });

        // Set the cursor to the calculated new position if there was an insertion
        if (newCursorPos !== null) {
          quill.setSelection(newCursorPos, Quill.sources.SILENT);
        }

        isHandlingChange = false; // Reset the flag after handling

        let qdc = new QuillDeltaToHtmlConverter(delta.ops, window.opts_ || {});

        qdc.renderCustomWith(function (customOp) {
          if (customOp.insert.type === "TemplateMarker") {
            let val = customOp.insert.value;
            return val.marker;
          }
        });

        // Convert the Delta JSON to HTML
        let html = qdc.convert();

        setInnerHtml(html);
      });

      quill.root.addEventListener("copy", (e) => {
        const selection = quill.getSelection();
        if (selection) {
          const html = quill.root.innerHTML;

          e.preventDefault();

          // Set the clipboard data
          e.clipboardData.setData("text/html", html);
        }
      });

      return () => {
        ref.current = null;
        container.innerHTML = "";
      };
    }, [ref]);
    return <div ref={containerRef}></div>;
  }
);

QuillEditor.displayName = "QuillEditor";

export default QuillEditor;
