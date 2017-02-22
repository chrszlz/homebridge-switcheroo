[![npm version](https://badge.fury.io/js/homebridge-switcheroo.svg)](https://badge.fury.io/js/homebridge-switcheroo)

# homebridge-switcheroo
User defined switches for http requests. Simple on/off or multiswitch radio buttons. Useful for lights, A/V systems, home automation, whatever


## Switch Types

### Switch (standard on/off)
Meant to be used as a simple on/off switch. 
 ==> light, projector, fan, garage door, car ignition (bad idea)

```
{
        "accessory": "Switcheroo",   // remember this *must* be 'Switcheroo'
        "type": "switch",
        "name": "Kitchen Light",
        "host": "192.168.0.XXX/kitchen",
        "on"  : "/light/on",
        "off" : "/light/off"
}
```

### Multiswitch (radio buttons)
Works like a switcher - only one input can ever be on at one time.
 ==> A/V input switcher, KVM control, temperature settings, really bad piano

Define your `multiswitch` with whatever `name` you want to appear as the input title on Homekit controls. Then, the appropriate endpoint `path` to call. Complete http endpoints are constructed as `host` + `path`.
Currently only built to support one http method per switch service, meaning, all endpoint calls will be either `GET` (default) or `POST` etc.
```
{
    "accessory": "Switcheroo",
    "type": "multiswitch",
    "name": "My HDMI Switcher",
    "host": "192.168.0.10X:8080",   // don't forget to specify a port, if necessary
    "multiswitch": [
       { "name" : "Apple TV"     , "path" : "/switcher/appletv" },
       { "name" : "HDMI"         , "path" : "/switcher/aux"     },
       { "name" : "Chromecast"   , "path" : "/switcher/chrome"  },
       { "name" : "PS4"          , "path" : "/switcher/ps4"     },
       { "name" : "Raspberry Pi" , "path" : "/switcher/pi"      }
    ]
}
```


## Configuration Params

|        Parameter       |                                     Description                                     | Required |
| -----------------------| ----------------------------------------------------------------------------------- |:--------:|
| `name`                 | name of the accessory                                                               |     ✓    |
| `type`                 | `switch` or `multiswitch`                                                           |     ✓    |
| `host`                 | url for whatever is receiving these requests                                        |     ✓    |
| `on` / `off`           | (only switch)  endpoint paths for the on/off states                                 |     ✓    |
| `on_body` / `off_body` | (only switch)  bodies for on/off state requests                                     |          |
| `multiswitch`          | (only multiswitch)  list of inputs for the multiswitch - `name` and endpoint `path` |     ✓    |
| `http_method`          | `GET` (default), `POST`,  `PUT`, `DELETE`                                           |          |
| `username`             | username for request                                                                |          |
| `password`             | password for request                                                                |          |
| `send_immediately`     | option for request                                                                  |          |
| `manufacturer`         | will show in Home app description of this Homekit accessory, ex. 'LG'               |          |
| `model`                | will show in Home app description of this Homekit accessory, ex. 'HD 2000'          |          |



## Debug logging

Running `homebridge` manually will allow you to see the Switcheroo console logs.

![Switcheroo logging](https://github.com/chriszelazo/homebridge-switcheroo/raw/master/logging.png) 


## Tips

  - Run Homebridge on startup and have it restart if crashed, [read my notes](https://github.com/chriszelazo/Apartment-Homebridge-Setup#auto-restart-homebridge-after-a-crash)
  - Make sure specify a port in the if necessary. (i.e. `"base_url" : "http://192.168.0.XXX:2000"`)
  - Verify the correct `http_method` is begin used. Switcheroo defaults to `GET`

## Installation
Read about an example Raspberry Pi + Homebridge setup guide with this package [here](https://github.com/chriszelazo/Apartment-Homebridge-Setup)

1. Install homebridge using: `npm install -g homebridge`
2. Install homebridge-http using: `npm install -g homebridge-switcheroo`
3. Update your config file


## Changes from `1.X.X`

###  New 
 - define unique paths for each `multiswitch` item
 - `manufacturer`, `model` params

### Renamed
 - 'switch_type' -> 'type'
 - 'Switch'      -> 'switch'
 - 'Multiswitch' -> 'multiswitch'
 - 'base_url'    -> 'host'
 - 'on_url'      -> 'on'
 - 'off_url'     -> 'off'

