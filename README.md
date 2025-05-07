# AWS-instance-cpu-usage

The goal of this exercise is to extract performance information for an AWS instance and display the CPU usage over time. 
- Inputs :
    1. The ip address of the instance 
    2. The time period to display the chart for 
    3. The interval between samples 

- Backend using flask
- Frontend using HTML, CSS and JS 


## *to run this project:*

    python -m venv venv

    source venv/bin/activate

    pip install -r requirements.txt
    
    python .\backend\app.py


if doesn't work installing the requirments, use this instead: 

    python -m pip install -r requirements.txt



!! BE SURE to fill the .env.example file to your credentials and change the file name from .env.example to .env !!
