/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
import { forwardRef, useEffect, useRef } from "react";
import Quill from "quill";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import "quill/dist/quill.core.css";
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
    const defaultValueRef = useRef(defaultValue);

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
        const markerRegex = /\{\{(.*?)\}\}/g;

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

      if (defaultValueRef.current) {
        const delta = quill.clipboard.convert(defaultValueRef.current); // Convert HTML to Delta

        processMarkers(quill, delta);
        setInnerHtml(defaultValueRef.current);
      }

      let isHandlingChange = false; // Flag to prevent recursive text change handling

      quill.on(Quill.events.TEXT_CHANGE, () => {
        if (isHandlingChange) return;

        isHandlingChange = true; // Set the flag to prevent recursion

        const delta = quill.getContents();
        const ops = delta.ops;

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
              quill.insertEmbed(
                startIndex,
                "TemplateMarker",
                {
                  marker: markerName.replaceAll(/\s/g, ""),
                  title: markerName.replace(/[{}]/g, "").trim(),
                },
                Quill.sources.SILENT
              ); // Insert the TemplateMarker silently

              quill.insertText(startIndex + 1, " ", Quill.sources.SILENT);
              quill.setSelection(startIndex + 2, Quill.sources.SILENT);
            }
          }

          currentIndex += op.insert.length || 1; // Update current index position
        });

        // Prevent moving the cursor after the last marker
        const markerPosition = quill.getLength() - 2;
        const selection = quill.getSelection();

        if (selection && selection.index > markerPosition) {
          quill.setSelection(markerPosition, Quill.sources.SILENT);
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

        // Convert the Delta to plain text
        // const plainTextDelta = quill.getContents();
        // let plainTextWithMarkers = "";

        // plainTextDelta.ops.forEach((op) => {
        //   if (typeof op.insert === "string") {
        //     plainTextWithMarkers += op.insert;
        //   } else if (op.insert.TemplateMarker) {
        //     plainTextWithMarkers += `${op.insert.TemplateMarker.marker}`;
        //   }
        // });

        // setInnerPlainText(plainTextWithMarkers);
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
