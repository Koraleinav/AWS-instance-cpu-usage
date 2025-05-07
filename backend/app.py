from flask import Flask, render_template, request, jsonify
import boto3 # api for the aws sdk services
import os
from dotenv import load_dotenv
from datetime import datetime

app = Flask(__name__,   template_folder='../frontend/templates', static_folder='../frontend/static')

load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
REGION = os.getenv("REGION")


""" ti interact with ec2 instance  """
ec2 = boto3.resource('ec2',
                     region_name=REGION,
                     aws_access_key_id=AWS_ACCESS_KEY,
                     aws_secret_access_key=AWS_SECRET_KEY)

"""  to get query metrics(in our case, cpu usage) from ec2 using the instance id """
cloudwatch = boto3.client('cloudwatch',
                          region_name=REGION,
                          aws_access_key_id=AWS_ACCESS_KEY,
                          aws_secret_access_key=AWS_SECRET_KEY)


def get_instance_id_by_ip(ip_address: str) ->str| None:
    """ this function find the ec2 instance id that matches the ip from the input """

    instances = ec2.instances.all()
    for instance in instances:
        if instance.private_ip_address == ip_address:
            return instance.id
    return None


def parse_request_params():
    """ this function  extract and validate query parameters from the request """

    ip = request.args.get('ip')
    start_str = request.args.get('start')
    end_str = request.args.get('end')
    interval = request.args.get('interval')

    if not ip:
        raise ValueError("IP address is required")
    if not start_str or not end_str:
        raise ValueError("Start and end times are required")
    if not interval:
        raise ValueError("Interval is required")

    start_time = datetime.fromisoformat(start_str)
    end_time = datetime.fromisoformat(end_str)
    interval_seconds = int(interval)

    return ip, start_time, end_time, interval_seconds


def fetch_cpu_metrics(instance_id: str, start: datetime, end: datetime, period: int):
    """ this function query cloudwatch for cpu data """

    return cloudwatch.get_metric_statistics(
        Namespace='AWS/EC2',
        MetricName='CPUUtilization',
        Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
        StartTime=start,
        EndTime=end,
        Period=period,
        Statistics=['Average'],
        Unit='Percent'
    )


def format_metrics_data(raw_data):
    """ this function convert raw clowdwatch data into a list of {time, value} dicts sorted by time """

    datapoints = raw_data.get('Datapoints', [])
    if not datapoints:
        return []
    
    sorted_datapoints = sorted(datapoints, key=lambda x: x['Timestamp'])

    formatted_data = []
    for point in sorted_datapoints:
        timestamp = point['Timestamp'].isoformat()
        average_value = point['Average']
        formatted_data.append({
            'time': timestamp,
            'value': average_value
        })

    return jsonify(formatted_data), 200


@app.route('/cpu-usage')
def cpu_usage():
    try:
        ip, start_time, end_time, interval = parse_request_params()
        instance_id = get_instance_id_by_ip(ip)
        if not instance_id:
            return jsonify({'error': 'No instance found with this IP address'}), 404

        raw_metrics = fetch_cpu_metrics(instance_id, start_time, end_time, interval)
        return format_metrics_data(raw_metrics) 

    except ValueError as value_error:
        return jsonify({'error': str(value_error)}), 400
    except Exception as error:
        return jsonify({'error': str(error)}), 500
    

@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)


