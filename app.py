# app.py

from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

# Главная страница
@app.route('/')
def index():
    return render_template('index.html')

# Пример функции, которая обрабатывает запросы (например, получение случайного числа)
@app.route('/get_random_number', methods=['GET'])
def get_random_number():
    random_number = random.randint(1, 100)
    return jsonify({"random_number": random_number})

if __name__ == '__main__':
    app.run(debug=True)
