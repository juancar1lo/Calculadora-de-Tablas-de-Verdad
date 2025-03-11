document.addEventListener('DOMContentLoaded', function() {
    const inputExpresion = document.getElementById('expresion');
  
    // Función para agregar caracteres al campo de expresión
    function appendToExpression(value) {
      inputExpresion.value += value;
    }
  
    // Asignar eventos a los botones de variables
    document.getElementById('btnP').addEventListener('click', () => appendToExpression('p'));
    document.getElementById('btnQ').addEventListener('click', () => appendToExpression('q'));
    document.getElementById('btnR').addEventListener('click', () => appendToExpression('r'));
    document.getElementById('btnS').addEventListener('click', () => appendToExpression('s'));
    document.getElementById('btnT').addEventListener('click', () => appendToExpression('t'));
  
    // Asignar eventos a los botones de símbolos lógicos
    document.getElementById('btnAnd').addEventListener('click', () => appendToExpression('∧'));
    document.getElementById('btnOr').addEventListener('click', () => appendToExpression('∨'));
    document.getElementById('btnNot').addEventListener('click', () => appendToExpression('¬'));
    document.getElementById('btnConditional').addEventListener('click', () => appendToExpression('→'));
    document.getElementById('btnBiconditional').addEventListener('click', () => appendToExpression('↔'));
    document.getElementById('btnOpenParen').addEventListener('click', () => appendToExpression('('));
    document.getElementById('btnCloseParen').addEventListener('click', () => appendToExpression(')'));
  
    // Botón para limpiar la expresión y el resultado
    document.getElementById('btnLimpiar').addEventListener('click', function() {
      inputExpresion.value = "";
      document.getElementById('resultadoTabla').innerHTML = "";
    });
  
    /* 
     * Implementamos un parser recursivo para evaluar la expresión lógica.
     * Se definen las siguientes funciones:
     * - tokenize: convierte la cadena en un arreglo de tokens.
     * - parseExpression: implementa el análisis recursivo siguiendo la precedencia:
     *     ¬ > ∧ > ∨ > → > ↔
     * - evaluateTree: evalúa el árbol obtenido según los valores asignados a las variables.
     */
  
    function tokenize(expr) {
      expr = expr.replace(/\s+/g, '');
      let tokens = [];
      for (let i = 0; i < expr.length; i++) {
        let ch = expr[i];
        if ("pqrst".includes(ch)) {
          tokens.push({ type: "VAR", value: ch });
        } else if ("∧∨¬→↔()".includes(ch)) {
          tokens.push({ type: "OP", value: ch });
        } else {
          // Ignorar otros caracteres
        }
      }
      return tokens;
    }
  
    function parseExpression(expr) {
      let tokens = tokenize(expr);
      let index = 0;
  
      function peek() {
        return tokens[index];
      }
  
      function consume() {
        return tokens[index++];
      }
  
      // parsePrimary: variable o expresión entre paréntesis
      function parsePrimary() {
        let token = peek();
        if (!token) throw new Error("Expresión incompleta");
        if (token.type === "VAR") {
          consume();
          return { type: "VAR", name: token.value };
        } else if (token.value === "(") {
          consume(); // consume '('
          let node = parseBiconditional();
          if (!peek() || peek().value !== ")") {
            throw new Error("Se esperaba ')'");
          }
          consume(); // consume ')'
          return node;
        } else {
          throw new Error("Token inesperado: " + token.value);
        }
      }
  
      // parseNot: maneja el operador ¬ (unario, derecho-asociativo)
      function parseNot() {
        let token = peek();
        if (token && token.value === "¬") {
          consume();
          let operand = parseNot();
          return { type: "NOT", operand: operand };
        } else {
          return parsePrimary();
        }
      }
  
      // parseAnd: maneja ∧ (asociatividad por la izquierda)
      function parseAnd() {
        let node = parseNot();
        while (peek() && peek().value === "∧") {
          consume(); // consume ∧
          let right = parseNot();
          node = { type: "AND", left: node, right: right };
        }
        return node;
      }
  
      // parseOr: maneja ∨ (asociatividad por la izquierda)
      function parseOr() {
        let node = parseAnd();
        while (peek() && peek().value === "∨") {
          consume(); // consume ∨
          let right = parseAnd();
          node = { type: "OR", left: node, right: right };
        }
        return node;
      }
  
      // parseImp: maneja → (derecho-asociativo)
      function parseImp() {
        let node = parseOr();
        if (peek() && peek().value === "→") {
          consume(); // consume →
          let right = parseImp();
          node = { type: "IMP", left: node, right: right };
        }
        return node;
      }
  
      // parseBiconditional: maneja ↔ (asociatividad por la izquierda)
      function parseBiconditional() {
        let node = parseImp();
        while (peek() && peek().value === "↔") {
          consume(); // consume ↔
          let right = parseImp();
          node = { type: "BICOND", left: node, right: right };
        }
        return node;
      }
  
      let tree = parseBiconditional();
      if (index < tokens.length) {
        throw new Error("Tokens sobrantes en la expresión");
      }
      return tree;
    }
  
    // Evalúa el árbol de la expresión dado un objeto de asignación de valores (ej: {p:true, q:false, ...})
    function evaluateTree(node, values) {
      switch (node.type) {
        case "VAR":
          return !!values[node.name];
        case "NOT":
          return !evaluateTree(node.operand, values);
        case "AND":
          return evaluateTree(node.left, values) && evaluateTree(node.right, values);
        case "OR":
          return evaluateTree(node.left, values) || evaluateTree(node.right, values);
        case "IMP":
          return (!evaluateTree(node.left, values)) || evaluateTree(node.right, values);
        case "BICOND":
          return evaluateTree(node.left, values) === evaluateTree(node.right, values);
        default:
          throw new Error("Tipo de nodo desconocido: " + node.type);
      }
    }
  
    // Nueva función evaluateExpression que utiliza el parser
    function evaluateExpression(expr, values) {
      try {
        let tree = parseExpression(expr);
        let result = evaluateTree(tree, values);
        return result ? 1 : 0;
      } catch (e) {
        console.error("Error evaluando la expresión:", e);
        return 0;
      }
    }
  
    // Función para obtener las variables (p, q, r, s, t) presentes en la expresión
    function getVariables(expr) {
      let vars = [];
      ['p', 'q', 'r', 's', 't'].forEach(v => {
        let regex = new RegExp('\\b' + v + '\\b');
        if (regex.test(expr)) {
          vars.push(v);
        }
      });
      return vars;
    }
  
    // Generar la tabla de verdad en base a la expresión
    function generateTruthTable(expression) {
      let vars = getVariables(expression);
      // Si no se detecta ninguna variable, se asume que es una expresión constante
      if (vars.length === 0) {
        let result = evaluateExpression(expression, {});
        return { vars: [], rows: [[result]] };
      }
      let rows = [];
      let numRows = Math.pow(2, vars.length);
      for (let i = 0; i < numRows; i++) {
        let values = {};
        let row = [];
        // Generar la combinación de 0 y 1 para cada variable
        for (let j = 0; j < vars.length; j++) {
          let val = (i >> (vars.length - j - 1)) & 1;
          values[vars[j]] = (val === 1);
          row.push(val);
        }
        // Evaluar la expresión con la asignación actual
        let result = evaluateExpression(expression, values);
        row.push(result);
        rows.push(row);
      }
      return { vars: vars, rows: rows };
    }
  
    // Renderizar la tabla de verdad en HTML e indicar el veredicto final (resultado en negrita)
    function renderTruthTable(tableData, expression) {
      let html = '<table><thead><tr>';
      // Encabezados para las variables
      tableData.vars.forEach(v => {
        html += '<th>' + v + '</th>';
      });
      // Encabezado para el resultado de la expresión
      html += '<th>' + expression + '</th>';
      html += '</tr></thead><tbody>';
      let resultados = [];
      tableData.rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
          html += '<td>' + cell + '</td>';
        });
        html += '</tr>';
        resultados.push(row[row.length - 1]);
      });
      html += '</tbody></table>';
      
      // Clasificar el resultado:
      // Si todos son 1 → Tautología; si todos son 0 → Contradicción; si hay mezcla → Indeterminación.
      let uniqueResults = Array.from(new Set(resultados));
      let verdict = '';
      if (uniqueResults.length === 1) {
        verdict = (uniqueResults[0] === 1) ? 'Tautología' : 'Contradicción';
      } else {
        verdict = 'Indeterminación';
      }
      html += '<p><strong>Resultado: ' + verdict + '</strong></p>';
      return html;
    }
  
    // Manejar el envío del formulario para generar y mostrar la tabla de verdad
    document.getElementById('tablaVerdadForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const expression = inputExpresion.value;
      let tableData = generateTruthTable(expression);
      let tableHTML = renderTruthTable(tableData, expression);
      document.getElementById('resultadoTabla').innerHTML = tableHTML;
    });
  });
  