import json


with open("input.json", "r") as f:
    input_json = json.load(f)  # type:dict

output_temp = {}

elem: dict
for elem in input_json:

    output_temp[elem["name"]] = elem["rootPath"]

with open("output.json", "w") as f:
    json.dump({"temp": output_temp}, f)
