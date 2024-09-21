const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = ()=>{
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex)=>{
        row.forEach((square, squareindex)=>{
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", 
                (rowindex + squareindex)%2 === 0 ? "light":"dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.column = squareindex;
            if(square){
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e)=>{
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = {row: rowindex, column: squareindex};
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e)=>{
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function(e){
                e.preventDefault();
            });


            squareElement.addEventListener("drop", function(e){
                e.preventDefault();
                if(draggedPiece){
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.column),
                    };

                    handleMove(sourceSquare, targetSource);

                }
            });
            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole === 'b'){
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};
const handleMove = (source, target) => {
    // Check if target.col and target.row are properly converted to numbers
    const fromColumn = parseInt(source.column);
    const fromRow = parseInt(source.row);
    const toColumn = parseInt(target.col);
    const toRow = parseInt(target.row);

    // Ensure these are numbers and valid indices
    if (isNaN(fromColumn) || isNaN(fromRow) || isNaN(toColumn) || isNaN(toRow)) {
        console.error("Invalid row/column values for move:", { source, target });
        return;
    }

    // Construct the move in algebraic notation (e.g., 'e2' to 'e4')
    const move = {
        from: `${String.fromCharCode(97 + fromColumn)}${8 - fromRow}`,
        to: `${String.fromCharCode(97 + toColumn)}${8 - toRow}`,
        promotion: "q"  // Assuming promotion to Queen for pawns reaching the last rank
    };

    console.log("Move being sent:", move); // Should be in format {from: "e2", to: "e4"}

    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const pieces = {
        p: "♙", // Black Pawn
        r: "\u265C", // Black Rook
        n: "\u265E", // Black Knight
        b: "\u265D", // Black Bishop
        q: "\u265B", // Black Queen
        k: "\u265A", // Black King
        P: "♙", // White Pawn
        R: "\u2656", // White Rook
        N: "\u2658", // White Knight
        B: "\u2657", // White Bishop
        Q: "\u2655", // White Queen
        K: "\u2654"  // White King
    };
    return pieces[piece.type] || "";
};

socket.on("playerRole", function(role){
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function(){
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function(fen){
    chess.load(fen);
    renderBoard();
});

socket.on("move", function(move){
    chess.move(move);
    renderBoard();
});


renderBoard();