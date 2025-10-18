from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Data soal teka-teki silang - hanya 1 set soal
PUZZLE_DATA = {
    "clues": {
        "mendatar": {
            "4": "Memiliki rumus keliling k=2(p+l)",
            "5": "Hasil operasi (11-3)÷2",
            "6": "Hasil operasi 2x4+3"
        },
        "menurun": {
            "1": "Memiliki rumus luas L=(axt)÷2",
            "2": "Keliling persegi dengan panjang sisi 3 satuan",
            "3": "Luas persegipanjang dengan panjang 2 satuan dan lebar 8 satuan"
        }
    },
    "answers": {
        "4": {"word": "PERSEGIPANJANG", "start": [2, 0], "direction": "across", "length": 14},
        "5": {"word": "EMPAT", "start": [4, 1], "direction": "across", "length": 5},
        "6": {"word": "SEBELAS", "start": [6, 0], "direction": "across", "length": 7},
        "1": {"word": "SEGITIGA", "start": [0, 5], "direction": "down", "length": 8},
        "2": {"word": "DUABELAS", "start": [0, 8], "direction": "down", "length": 8},
        "3": {"word": "ENAMBELAS", "start": [0, 11], "direction": "down", "length": 9}
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_puzzle')
def get_puzzle():
    return jsonify(PUZZLE_DATA)

@app.route('/check_answer', methods=['POST'])
def check_answer():
    data = request.json
    clue_num = data.get('clue_num')
    answer = data.get('answer', '').upper().strip()
    
    if clue_num in PUZZLE_DATA['answers']:
        correct_answer = PUZZLE_DATA['answers'][clue_num]['word']
        is_correct = answer == correct_answer
        return jsonify({
            'correct': is_correct,
            'answer': correct_answer if is_correct else None
        })
    
    return jsonify({'correct': False})

if __name__ == '__main__':
    app.run(debug=True, port=5056)