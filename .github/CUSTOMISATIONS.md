# MoE Customisations to ReDoc

This fork of [ReDoc v2.0.0-rc.20](https://github.com/Redocly/redoc/tree/v2.0.0-rc.20) has the following customisations:

- [JSON Schema `const`](#json-schema-const)
- [Vendor Extensions Display](#vendor-extensions-display)

## Development
see [CONTRIBUTING.md](CONTRIBUTING.md) to read the original guidelines on development of this [React](https://en.wikipedia.org/wiki/React_(web_framework)) application

### Commonly used Yarn/NPM scripts

``` bash
# dev-server, watch and auto reload playground
$ yarn start

# runt tslint
$ yarn lint

# try autofix tslint issues
$ yarn lint --fix

# run unit tests
$ yarn unit

# prepare bundles
$ yarn bundle

# put bundles into place for redoc-cli
$ yarn bundle:cli
```

There are some other scripts available in the `scripts` section of the `package.json` file.

## JSON Schema Const
- JSON Schema uses keyword `const` as short hand for a single `enum` value, which allows us to have titles and description fields for each enumeration value, thus:
```JSON
  NZCodeSetsGender:
    type: string
    title: Gender
    description: >-
      <p>A Person may identify as having a Gender (or Gender Identity). Biological sex and sexual orientation are related but
      different concepts. Sourced from Statistics NZ Standard for Gender Identity</p>
    oneOf:
    - const: '1'
      title: Male
    - const: '2'
      title: Female
    - const: '3'
      title: Gender Diverse
      description: But not further defined
    - const: '31'
      title: Transgender Male to Female
      description: 'Can be rolled up to 3:Gender Diverse'
    - const: '32'
      title: Transgender Female to Male
      description: 'Can be rolled up to 3:Gender Diverse'
    - const: '9'
      title: Not Willing to Disclose
```

## Vendor Extensions Display
- Vendor extension fields (ones with `x-` prefix) are displayed as follows
  - If field is a JSON object, it is displayed in a code block, using [json-stringify-pretty-compact](https://www.npmjs.com/package/json-stringify-pretty-compact)
  - If field is a string, it is treated as markdown

- Vendor extension fields are initially displayed collapsed - just click on the label to expand.

  ![](../docs/images/collapsed-extensions-demo.gif)