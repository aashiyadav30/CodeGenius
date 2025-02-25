const express = require("express");
const app = express();
const bodyP = require("body-parser");
const compiler = require("compilex");

const options = { stats: true };
compiler.init(options);

app.use(bodyP.json());
app.use("/codemirror-5.65.18", express.static("C:/Users/ajeet/Downloads/CodeEditor1/codemirror/codemirror-5.65.18"));

app.get("/", function (req, res) {
    compiler.flush(() => console.log("Deleted previous compilation files."));
    res.sendFile("C:/Users/ajeet/Downloads/CodeEditor1/index.html");
});

app.post("/compile", function (req, res) {
    const { code, input, lang } = req.body;
    let envData = { OS: "windows", options: { timeout: 10000 } };

    // 🔥 Highlighting Function: Extracts error line number and formats the output
    const formatErrorMessage = (error, code) => {
        if (!error) return "Unknown error occurred.";

        const match = error.match(/(line (\d+))/i); // Extracts "line X" from error messages
        if (match && match[2]) {
            const errorLine = parseInt(match[2]); // Get the line number
            const codeLines = code.split("\n"); // Split code into lines

            let formattedCode = codeLines
                .map((line, index) =>
                    index + 1 === errorLine
                        ? `>> ${index + 1}: ${line}   <-- ERROR HERE`  // 🔥 Highlight error line
                        : `   ${index + 1}: ${line}`
                )
                .join("\n");

            return `Compilation/Runtime Error:\n${error}\n\nHighlighted Code:\n${formattedCode}`;
        }

        return `Compilation/Runtime Error:\n${error}`;
    };

    // 🔥 Response Handler: Sends formatted error message or output
    const handleResponse = (data) => {
        if (data.output) {
            res.send({ output: data.output });
        } else if (data.error) {
            res.send({ output: formatErrorMessage(data.error, code) });
        } else {
            res.send({ output: "Unknown error occurred." });
        }
    };

    try {
        switch (lang) {
            case "Cpp":
                envData.cmd = "g++";
                input
                    ? compiler.compileCPPWithInput(envData, code, input, handleResponse)
                    : compiler.compileCPP(envData, code, handleResponse);
                break;

            case "Java":
                input
                    ? compiler.compileJavaWithInput(envData, code, input, handleResponse)
                    : compiler.compileJava(envData, code, handleResponse);
                break;

            case "Python":
                input
                    ? compiler.compilePythonWithInput(envData, code, input, handleResponse)
                    : compiler.compilePython(envData, code, handleResponse);
                break;

            default:
                res.send({ output: "Unsupported language selected." });
        }
    } catch (e) {
        console.error("Server-side error:", e);
        res.send({ output: "Internal server error occurred." });
    }
});

app.listen(8000, () => {
    console.log("Server running on port 8000...");
});
