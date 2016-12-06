# homebridge-switcheroo

Simple HTTP switches for Homebridge - Stateful, Stateless, Radio/Multi Switch

## Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install homebridge-http using: `npm install -g homebridge-switcheroo`
3. Update your config file

##Configuration samples:

### Switch
```
{
        "accessory": "Switcheroo",
        "service": "Switch",
        "name": "Test Switch",
        "http_method": "GET",
        "base_url": "http://192.168.0.111:3000",
        "on_url": "/switcher/input/1",
        "off_url": "/switcher/inupt/5"
}
```


### Multiswitch (Radio buttons)
Multiswitch appends the index number of the switch defined below as the final piece of the path. For example, when `MultiInput 3` is selected, the url generated will be `http://192.168.0.111:3000/switcher/input/3` (1-based numbering). 
```
{
    "accessory": "Switcheroo",
    "service": "Multiswitch",
    "name": "Test Multiswitch",
    "http_method": "GET",
    "base_url": "http://192.168.0.111:3000/switcher/input",
    "multiswitch": [
       "MultiInput 1",
       "MultiInput 2",
       "MultiInput 3",
       "MultiInput 4",
       "MultiInput 5"
    ]
}
 ```