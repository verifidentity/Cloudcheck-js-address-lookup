var AddressLookup = {
    LOOKUP_URL: "https://api.cloudcheck.co.nz/addresslookup",
    API_KEY: "",
    FEATURE_OPTS: {
        exposeAttributes:1,
        addressTypeFilter: "urban,rural",
        positionFilter: "doorstop,rooftop,single",
        singleLineHitNumber: 10,
        caseType: "TITLE"
    },
    CLIENT_OPTS: {
        minLength: 3,
        onSelect: (event) => {},
        onRetrieve: (event) => {}
    },
    NZ: "NZ",
    AU: "AU",
    INTERNATIONAL: "INT",
    NZAD: "NZAD",
    NZPAF: "NZPAF",
    AUPAF: "AUPAF",
    COUNTRY: "NZ",
    POSTCODE_LOCALITY: "postcodeLocality",
    SOURCE_OF_TRUTH: "sourceOfTruth",
    STATE: "state",
    STREET_2: "street2",
    STREET: "street",
    STREET_ADDRESS: "streetAddress",
    STREET_NUMBER: "streetNumber",
    SUBDWELLING: "subdwelling",
    SUBURB: "suburb",
    TOWN_CITY: "townCity",
    DISTRICT: "district",
    CITY: "city",
    PROVINCE: "province",
    FULL_ADDRESS: "fullAddress",
    FLOOR_LEVEL_TYPE: "floorLevelType",
    FLOOR_LEVEL_NUMBER: "floorLevelNumber",
    FLAT_UNIT_TYPE: "flatUnitType",
    FLAT_UNIT_NUMBER: "flatUnitNumber",
    LOT_NUMBER: "lotNumber",
    STREET_NAME: "streetName",
    STREET_TYPE: "streetType",
    STREET_SUFFIX: "streetSuffix",
    FLOOR_LEVEL_TYPES: "floorLevelTypes",
    POSTAL_TYPES: "postalTypes",
    STATE_TYPES: "stateTypes",
    STREET_TYPES: "streetTypes",
    STREET_SUFFIX_TYPES: "streetSuffixTypes",
    UNIT_FLAT_TYPES: "unitFlatTypes",
    UP_KEY: 38,
    DOWN_KEY: 40,
    ENTER_KEY: 13,
    GEOCODE: "geocode",
    SOURCE_OF_TRUTH_MAP: {
        NZ: "NZAD",
        AU: "AUPAF",
        INT: ""
    },
    SOURCE_OF_TRUTH: "",
    INPUT_FIELD: {},
    OUTPUT_FIELDS: {},
    SELECTED_ITEM: -1,
    /**
     * specifies the base url in case a different url is preferred
     * @param {string} baseUrl the base url where all the API calls are sent to
     */
    init: (baseUrl) => {
        AddressLookup.LOOKUP_URL = baseUrl
    },
    /**
     * Authenticates the user and sets the api key. This key will be used for all API calls from here on.
     * @param {string} apiKey the api key to use for authentication
     */
    auth: (apiKey) => {
        AddressLookup.API_KEY = apiKey
    },
    /**
     * sets the feature options. This specifies what filters or similar are applied to the requests and responses
     * @param {object} opts
     */
    useFeatureOptions: (opts) => {
        AddressLookup.FEATURE_OPTS = AddressLookup.FEATURE_OPTS.assign(opts);
    },
    /**
     * sets the client options. This specifies behavior of how the requests are called and how the responses are handled
     * @param {object} opts the client options
     */
    useClientOptions: (opts) => {
        AddressLookup.CLIENT_OPTS = Object.assign(AddressLookup.CLIENT_OPTS, opts);
    },
    /**
     * sets a source of truth, a JS object may also be passed to map countrycodes to different sources of truth
     * @param {any} sot the source of truth to be set or a country to source of truth mapping
     */
    useSourceOfTruth: (sot) => {
        if (typeof sot == 'string' || str instanceof String) {
            AddressLookup.SOURCE_OF_TRUTH = sot;
        } else {
            AddressLookup.SOURCE_OF_TRUTH_MAP = sot;
        }
    },
    /**
     * associate an addressProperty with a form field. After the retrieve method,
     * the relevant fields will be populated with the associated data.
     * If no fields are added, the full address will be given to the input field
     * @param {string} addressProperty The property of the address to be added, such as AddressLookup.SUBURB or AddressLookup.STREETNAME
     * @param {string} fieldId the id of the form field which will contain the data after the retrieve call.
     */
    addField: (addressProperty, fieldId) => {
        AddressLookup.OUTPUT_FIELDS[addressProperty] = fieldId
    },
    /**
     * sets up autocomplete on the inputField, using the countryField
     * @param {string} inputFieldId
     * @param {string} countryFieldId
     */
    autocomplete: (inputFieldId, countryFieldId)  => {
    	var resultList = $('<div></div>');
        AddressLookup.INPUT_FIELD = $(`#${inputFieldId}`);
        AddressLookup.INPUT_FIELD.keypress(() => {
            if (AddressLookup.INPUT_FIELD.val().length >= AddressLookup.CLIENT_OPTS.minLength) {
            	resultList.remove();
        		resultList = $('<div class="autocomplete"></div>');
        		AddressLookup.INPUT_FIELD.parent().append(resultList);
                if ($(`#${countryFieldId}`).length > 0) {
                    AddressLookup.COUNTRY = $(`#${countryFieldId}`).val();
                }
                AddressLookup.find(
                    (response) => {
                        for (let i = 0; i < response.payload.length; i++) {
                            var resultItem = $(`<div id="address${i}">${response.payload[i].fullAddress}</div>`);
                            resultItem.click(() => {
                                AddressLookup.populateFields(response.payload[i]);
                                resultList.empty();
                                AddressLookup.CLIENT_OPTS.onSelect(response.payload[i]);
                                AddressLookup.retrieve(
                                    response.payload[i].id,
                                    (response) => AddressLookup.CLIENT_OPTS.onRetrieve(response),
                                    (err) => console.log(err),
                                )
                            })
                            resultList.append(resultItem)
                        }
                    },
                    (err) => {
                        console.log(err);
                    }
                );
            }

        })
        AddressLookup.INPUT_FIELD.keydown((event) => {
            console.log(event.keyCode);
            if (event.keyCode == AddressLookup.UP_KEY) {
                $(`#address${AddressLookup.SELECTED_ITEM}`).removeClass('selected');
                AddressLookup.SELECTED_ITEM -= 1;
                $(`#address${AddressLookup.SELECTED_ITEM}`).addClass('selected');
            } else if (event.keyCode == AddressLookup.DOWN_KEY) {
                $(`#address${AddressLookup.SELECTED_ITEM}`).removeClass('selected');
                AddressLookup.SELECTED_ITEM += 1;
                $(`#address${AddressLookup.SELECTED_ITEM}`).addClass('selected');
            } else {
                $(".selected").click();
            }

        })
    },
    /**
     * populate fields with the address data based on which fields have been specified, by default put everything in the input field
     * @param {object} retrievedAddress the adress object returned by the retrieve method
     */
    populateFields: (retrievedAddress) => {
        var entries = Object.entries(AddressLookup.OUTPUT_FIELDS);
        AddressLookup.INPUT_FIELD.val(retrievedAddress.fullAddress);
        for (let [addressProperty, fieldId] of entries) {
            $(`#${fieldId}`).val(retrievedAddress[addressProperty]);
        }
    },
    /**
     * makes a find call
     * @param {function} onSuccess callback function for a succesful AJAX request
     * @param {function} onFail callback function for a failed AJAX request
     */
    find: (onSuccess, onFail) => {
        $.ajax({
            type:"POST",
            url:`${AddressLookup.LOOKUP_URL}/find/`,
            data: JSON.stringify({
                featureOptions: AddressLookup.FEATURE_OPTS,
                payload:[
                    {
                        "fullAddress": `${AddressLookup.INPUT_FIELD.val()}`,
                        "country": AddressLookup.COUNTRY
                    }
                ],
                sourceOfTruth: AddressLookup.SOURCE_OF_TRUTH || AddressLookup.SOURCE_OF_TRUTH_MAP[AddressLookup.COUNTRY]
            }),
            contentType: "application/json; charset=utf-8",
            headers: { 'x-api-key': AddressLookup.API_KEY}
        }).done((response) => {
            onSuccess(response);

        }).fail((err) => {
            onFail(err);
        })
    },
    /**
     * makes a retrieve call
     * @param {function} onSuccess callback function for a succesful AJAX request
     * @param {function} onFail callback function for a failed AJAX request
     */
    retrieve: (id, onSuccess, onFail) => {
        $.ajax({
            type:"POST",
            url:`${AddressLookup.LOOKUP_URL}/retrieve/`,
            data: JSON.stringify({
                featureOptions: AddressLookup.FEATURE_OPTS,
                payload:[
                    {
                        id: id
                    }
                ]
            }),
            contentType: "application/json; charset=utf-8",
            headers: { 'x-api-key': AddressLookup.API_KEY}
        }).done((response) => {
            onSuccess(response);
        }).fail((err) => {
            onFail(err);
        })
    }
}
