import ctypes

import raildriver

TYPE_NONE = 0
TYPE_STEAM = 1
TYPE_DIESEL = 2
TYPE_ELECTRIC = 3


class RailDriverExtended(raildriver.RailDriver):

    KEYS_BOTH = [
        'HandBrake',
        'Handbrake',
        'Regulator',
        'Reverser',
        'SpeedometerMPH',
        'SpeedometerKPH',
    ]
    KEYS_STEAM = [
        'BoilerPressureGaugePSI',
        'SteamChestPressureGaugePSI',
        'MainReservoirPressureINCHES',
        'WaterGauge',
        'FireboxDoor',
    ]
    KEYS_DIESEL = [
        'RPM',
        'Ammeter',
    ]

    KEYS_ALL = KEYS_BOTH + KEYS_STEAM + KEYS_DIESEL

    controllers = {}

    def __init__(self, dll_location=None):
        super().__init__(dll_location=dll_location)
        self.load_controllers()

    def unload(self):
        self.set_rail_driver_connected(False)  # stop data exchange
        ctypes.windll.kernel32.FreeLibrary(self.dll._handle)
        del self.dll

    def load_controllers(self):
        self.controllers = {name: index for index, name in self.get_controller_list()}
        print(self.controllers)

    def get_parameters(self):
        params = {}

        params['fuel'] = self.get_current_fuel_level()

        for key in self.KEYS_ALL:
            try:
                # lookup controller index from key name
                # print(key)
                params[key.lower()] = round(
                    self.get_current_controller_value(self.controllers[key]), 2,
                )
            except KeyError as err:  # Key does not exist in loco
                pass

        return params

    def get_loco_name(self):
        names = super().get_loco_name()
        if names:
            names = names[1:] + names[:1]

            return " • ".join(names).replace('_', ' ')
        else:
            return None

    def get_loco_type(self):
        # print(list(self.controllers))
        if 'BoilerPressureGaugePSI' in self.controllers:
            return TYPE_STEAM
        elif 'RPM' in self.controllers:
            return TYPE_DIESEL
        elif 'electric_key' in self.controllers:  # TODO: add appropriate key
            return TYPE_STEAM
        else:
            return TYPE_NONE


# # setup RailDriver
# rde = RailDriverExtended()
# rde.set_rail_driver_connected(True)  # start data exchange

# print(dict(rde.get_controller_list()).values())

# loco_name = rde.get_loco_name()
# print(loco_name)
