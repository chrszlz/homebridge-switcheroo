# homebridge-switcheroo

Simple HTTP switches for Homebridge - stateful and radio-button/multi-switch switches

## Switch Services

### Switch (standard on/off)
Meant to be used as a standard on/off switch. Light, projector, fan, etc.

```
{
        "accessory": "Switcheroo",
        "switch_type": "Switch",
        "name": "My Projector",
        "http_method": "GET",
        "base_url": "http://192.168.0.XXX/projector",
        "on_url": "/state/on",
        "off_url": "/state/off"
}
```

### Multiswitch (Radio buttons)
Meant to be used as a switcher, where only one input is ever on.

Multiswitch appends the index number of the switch defined below to complete the path. For example, when `Chromecast` is selected, the url generated will be `http://192.168.0.XXX/switcher/input/3` (1-based numbering). 
```
{
    "accessory": "Switcheroo",
    "switch_type": "Multiswitch",
    "name": "My Input Switcher",
    "http_method": "GET",
    "base_url": "http://192.168.0.XXX/switcher/input",
    "multiswitch": [
       "Apple TV",
       "HDMI",
       "Chromecast",
       "PS4",
       "Raspberry Pi"
    ]
}
```

## Configuration Params

|             Parameter            |                       Description                       | Required |
|:--------------------------------:|:-------------------------------------------------------:|:--------:|
| `name`                           | name of the accessory                                   |          |
| `switch_type`                    | `Switch` or `Multiswitch`                               |     ✓    |
| `base_url`                       | url endpoint for whatever is receiving these requests   |     ✓    |
| `http_method`                    | `GET` (default), `POST`,  `PUT`, `DELETE`               |          |
| `username`                       | username for request                                    |          |
| `password`                       | password for request                                    |          |
| `send_immediately`               | option for request                                      |          |
| `on_url` (only Switch)           | endpoint for the on state                               |     ✓    |
| `off_url` (only Switch)          | endpoint for the off state                              |     ✓    |
| `on_body` (only Switch)          | body for on state request                               |          |
| `off_body` (only Switch)         | body for off state request                              |          |
| `multiswitch` (only Multiswitch) | list of inputs for the Multiswitch - order is respected |     ✓    |

## Help

  - Make sure specify a port in the if necessary. (i.e. `\"base_url\" : \"http://192.168.0.XXX:2000\"`)
  - Verify the correct `http_method` is begin used. Switcheroo defaults to `GET`

## Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install homebridge-http using: `npm install -g homebridge-switcheroo`
3. Update your config file