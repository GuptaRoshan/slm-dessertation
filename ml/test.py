from flask import Flask
import re
from nltk.corpus import stopwords
# for Stemming propose
from nltk.stem import WordNetLemmatizer
from joblib import load
from flask import jsonify, request