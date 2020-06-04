import raildriver


class RailDriverExtended(raildriver.RailDriver):

    KEYS_BOTH = [
        'HandBrake',
        'Handbrake',
        'Regulator',
        'Reverser',
        'SpeedometerMPH',
    ]
    KEYS_STEAM = [
        'BoilerPressureGaugePSI',
        'SteamChestPressureGaugePSI',
        'MainReservoirPressureINCHES',
    ]
    KEYS_DIESEL = [
        'RPM',
        'Ammeter',
    ]

    KEYS_ALL = KEYS_BOTH + KEYS_STEAM + KEYS_DIESEL

    def get_parameters(self):
        params = {}

        for key in self.KEYS_ALL:
            try:
                params[key.lower()] = round(self.get_current_controller_value(key), 1)
            except ValueError as err:  # Key does not exist in loco
                pass

        return params


# setup RailDriver
rde = RailDriverExtended()
rde.set_rail_driver_connected(True)  # start data exchange

print(dict(rde.get_controller_list()).values())

loco_name = rde.get_loco_name()
print(loco_name)
