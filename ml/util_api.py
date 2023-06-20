from flask import Flask
import re
from nltk.corpus import stopwords
# for Stemming propose
from nltk.stem import WordNetLemmatizer
from joblib import load
from flask import jsonify, request
#import spacy
import en_core_web_sm
from textblob import TextBlob


app = Flask(__name__)

def process_docs(docs, rows) :
    corpus = []
    for i in range(0, rows):
        # column : "content", row ith
        content = re.sub('[^a-zA-Z]', ' ', docs[i])
        # convert all cases to lower cases
        content = content.lower()
        # split to array(default delimiter is " ")
        content = content.split()
        # ps = PorterStemmer()
        lem = WordNetLemmatizer()
        content = [lem.lemmatize(word) for word in content
                if not word in set(stopwords.words('english'))]  
        content = ' '.join(content) 
        corpus.append(content)
        
    return corpus  


@app.route('/su/predict', methods=['POST'])
def predict():
    vectorizer = load('vectorizer.pkl') 
    model = load('model.pkl')
    ne = en_core_web_sm.load()
    data = request.json
    
    for i in data: 
        content = i["content"]
        if content :
            corpus = vectorizer.transform([content])
            predictions = model.predict(corpus.toarray())
            predictions_proba = model.predict_proba(corpus.toarray())
            i["probability"] = predictions_proba.tolist()
            if predictions[0] == 2 :
                i["class"] = "Warm Lead"
            if predictions[0] == 0 :
                i["class"] = "Cold Lead"
            if predictions[0] == 1 :
                i["class"] = "Hot Lead" 
            
            #named entity recognition 
            doc = ne(content)
            ne_list = dict([(X.text,  X.label_) for X in doc.ents])
            i["entity"] = ne_list
            
    return jsonify(data)


@app.route('/un/predict', methods=['POST'])
def un_predict():
    data = request.json
    ne = en_core_web_sm.load()
    
    for i in data: 
        content = i["content"]
        
        if content :     
            blb = TextBlob(content)  
            
            if blb.sentiment[0] < 0:
                i["class"] = "Cold Lead"
                i["state"] = "Error"
                
       
            if blb.sentiment[0] > 0:
                i["class"] = "Hot Lead" 
                i["state"] = "Success"
   
            if blb.sentiment[0] == 0:
                i["class"] = "Warm Lead" 
                i["state"] = "Information"
            
            i["probability"] = blb.sentiment[0] * 100
            
            #named entity recognition 
            doc = ne(content)
            ne_list = dict([(X.label_ , X.text) for X in doc.ents])
            i["entity"] = ne_list
            
            
    return jsonify(data)
   

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081)