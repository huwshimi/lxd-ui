import React, { FC, ReactNode, useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Icon,
  Input,
  Label,
  Notification,
  Row,
  Select,
} from "@canonical/react-components";
import {
  LxdNetwork,
  LxdNetworkBridgeDriver,
  LxdNetworkBridgeMode,
  LxdNetworkDnsMode,
  LxdNetworkFanType,
  LxdNetworkType,
} from "types/network";
import { optionEnableDisable, optionYesNo } from "util/instanceOptions";
import NetworkFormMenu, {
  ADVANCED_OVN,
  BRIDGE,
  DNS,
  IPV4,
  IPV6,
  NETWORK_DETAILS,
  USER,
  YAML_CONFIGURATION,
} from "pages/networks/forms/NetworkFormMenu";
import { FormikProps } from "formik/dist/types";
import { updateMaxHeight } from "util/updateMaxHeight";
import useEventListener from "@use-it/event-listener";
import { useNotify } from "context/notify";
import { useSettings } from "context/useSettings";
import Loader from "components/Loader";
import YamlForm from "pages/instances/forms/YamlForm";

export interface NetworkFormValues {
  name: string;
  description?: string;
  type: LxdNetworkType;
  bridge_driver?: LxdNetworkBridgeDriver;
  bridge_external_interfaces?: string;
  bridge_hwaddr?: string;
  bridge_mode?: LxdNetworkBridgeMode;
  bridge_mtu?: string;
  dns_domain?: string;
  dns_mode?: LxdNetworkDnsMode;
  dns_search?: string;
  dns_zone_forward?: string;
  dns_zone_reverse_ipv4?: string;
  dns_zone_reverse_ipv6?: string;
  fan_type?: LxdNetworkFanType;
  fan_overlay_subnet?: string;
  fan_underlay_subnet?: string;
  ipv4_address?: string;
  ipv4_dhcp?: string;
  ipv4_dhcp_expiry?: string;
  ipv4_dhcp_gateway?: string;
  ipv4_dhcp_ranges?: string;
  ipv4_firewall?: string;
  ipv4_l3only?: string;
  ipv4_nat?: string;
  ipv4_nat_address?: string;
  ipv4_nat_order?: string;
  ipv4_ovn_ranges?: string;
  ipv4_routes?: string;
  ipv4_routing?: string;
  ipv6_address?: string;
  ipv6_dhcp?: string;
  ipv6_dhcp_expiry?: string;
  ipv6_dhcp_ranges?: string;
  ipv6_dhcp_stateful?: string;
  ipv6_firewall?: string;
  ipv6_l3only?: string;
  ipv6_nat?: string;
  ipv6_nat_address?: string;
  ipv6_nat_order?: string;
  ipv6_ovn_ranges?: string;
  ipv6_ovn_routes?: string;
  ipv6_ovn_routing?: string;
  user: {
    key: string;
    value: string;
  }[];
  yaml?: string;
}

export const toNetwork = (values: NetworkFormValues): Partial<LxdNetwork> => {
  const network: LxdNetwork = {
    name: values.name,
    description: values.description,
    type: values.type.startsWith("bridge") ? "bridge" : values.type,
    config: {
      ["bridge.driver"]: values.bridge_driver,
      ["bridge.external_interfaces"]: values.bridge_external_interfaces,
      ["bridge.hwaddr"]: values.bridge_hwaddr,
      ["bridge.mode"]: values.bridge_mode,
      ["bridge.mtu"]: values.bridge_mtu,
      ["dns.domain"]: values.dns_domain,
      ["dns.mode"]: values.dns_mode,
      ["dns.search"]: values.dns_search,
      ["dns.zone.forward"]: values.dns_zone_forward,
      ["dns.zone.reverse.ipv4"]: values.dns_zone_reverse_ipv4,
      ["dns.zone.reverse.ipv6"]: values.dns_zone_reverse_ipv6,
      ["ipv4.address"]: values.ipv4_address,
      ["ipv4.dhcp"]: values.ipv4_dhcp,
      ["ipv4.dhcp.expiry"]: values.ipv4_dhcp_expiry,
      ["ipv4.dhcp.gateway"]: values.ipv4_dhcp_gateway,
      ["ipv4.dhcp.ranges"]: values.ipv4_dhcp_ranges,
      ["ipv4.firewall"]: values.ipv4_firewall,
      ["ipv4.l3only"]: values.ipv4_l3only,
      ["ipv4.nat"]: values.ipv4_nat,
      ["ipv4.nat.address"]: values.ipv4_nat_address,
      ["ipv4.nat.order"]: values.ipv4_nat_order,
      ["ipv4.ovn.ranges"]: values.ipv4_ovn_ranges,
      ["ipv4.routes"]: values.ipv4_routes,
      ["ipv4.routing"]: values.ipv4_routing,
      ["ipv6.address"]: values.ipv6_address,
      ["ipv6.dhcp"]: values.ipv6_dhcp,
      ["ipv6.dhcp.expiry"]: values.ipv6_dhcp_expiry,
      ["ipv6.dhcp.ranges"]: values.ipv6_dhcp_ranges,
      ["ipv6.dhcp.stateful"]: values.ipv6_dhcp_stateful,
      ["ipv6.firewall"]: values.ipv6_firewall,
      ["ipv6.l3only"]: values.ipv6_l3only,
      ["ipv6.nat"]: values.ipv6_nat,
      ["ipv6.nat.address"]: values.ipv6_nat_address,
      ["ipv6.nat.order"]: values.ipv6_nat_order,
      ["ipv6.ovn.ranges"]: values.ipv6_ovn_ranges,
      ["ipv6.ovn.routes"]: values.ipv6_ovn_routes,
      ["ipv6.ovn.routing"]: values.ipv6_ovn_routing,
    },
  };

  values.user.forEach(
    ({ key, value }) => (network.config[`user.${key}`] = value)
  );

  return network;
};

interface Props {
  formik: FormikProps<NetworkFormValues>;
  isReadOnly?: boolean;
  getYaml: () => string;
}

const NetworkForm: FC<Props> = ({ formik, getYaml, isReadOnly }) => {
  const notify = useNotify();
  const [section, setSection] = useState(NETWORK_DETAILS);
  const { data: settings, isLoading } = useSettings();
  const hasOvn = Boolean(settings?.config["network.ovn.northbound_connection"]);
  const hasFan = settings?.environment?.os_name
    ?.toLowerCase()
    .includes("ubuntu");

  if (isLoading) {
    return <Loader />;
  }

  const updateFormHeight = () => {
    updateMaxHeight("form-contents", "p-bottom-controls");
  };
  useEffect(updateFormHeight, [notify.notification?.message, section]);
  useEventListener("resize", updateFormHeight);

  const getFormProps = (id: keyof Omit<NetworkFormValues, "user">) => {
    return {
      id: id,
      name: id,
      onBlur: formik.handleBlur,
      onChange: formik.handleChange,
      value: formik.values[id] ?? "",
      error: formik.touched[id] ? (formik.errors[id] as ReactNode) : null,
      placeholder: `Enter ${id.replaceAll("_", " ")}`,
      stacked: true,
      disabled: isReadOnly,
    };
  };

  return (
    <Form
      className="form network-form"
      onSubmit={() => void formik.submitForm()}
    >
      <NetworkFormMenu
        active={section}
        setActive={setSection}
        formik={formik}
      />
      <Row className="form-contents" key={section}>
        <Col size={12}>
          {section === NETWORK_DETAILS && (
            <React.Fragment>
              <Select
                {...getFormProps("type")}
                label="Type"
                required
                options={[
                  {
                    label: "Bridge (standard)",
                    value: "bridge-standard",
                  },
                  {
                    label: "Bridge (fan)",
                    value: "bridge-fan",
                    disabled: !hasFan,
                  },
                  {
                    label: "OVN",
                    value: "ovn",
                    disabled: !hasOvn,
                  },
                  {
                    label: "Macvlan",
                    value: "macvlan",
                    disabled: true,
                  },
                  {
                    label: "SR-IOV",
                    value: "sriov",
                    disabled: true,
                  },
                  {
                    label: "Physical",
                    value: "physical",
                    disabled: true,
                  },
                ]}
                onChange={(e) => {
                  if (e.target.value === "bridge-standard") {
                    formik.setFieldValue("type", "bridge-standard");
                    formik.setFieldValue("bridge_mode", "standard");
                  }
                  if (e.target.value === "bridge-fan") {
                    formik.setFieldValue("type", "bridge-fan");
                    formik.setFieldValue("bridge_mode", "fan");
                  }
                  if (e.target.value === "ovn") {
                    formik.setFieldValue("type", "ovn");
                    formik.setFieldValue("bridge_mode", undefined);
                  }
                }}
              />
              <Input
                {...getFormProps("name")}
                type="text"
                label="Name"
                required
              />
              <Input
                {...getFormProps("description")}
                type="text"
                label="Description"
              />
              {formik.values.bridge_mode !== "fan" && (
                <Input
                  {...getFormProps("ipv4_address")}
                  type="text"
                  label="IPv4 address"
                  help="IPv4 address for the bridge (use none to turn off IPv4 or auto to generate a new random unused subnet) (CIDR)"
                />
              )}
              {formik.values.ipv4_address !== "none" && (
                <Select
                  {...getFormProps("ipv4_nat")}
                  label="IPv4 NAT"
                  help="Network address translation for IPv4"
                  options={optionEnableDisable}
                />
              )}
              {formik.values.bridge_mode !== "fan" && (
                <Input
                  {...getFormProps("ipv6_address")}
                  type="text"
                  label="IPv6 address"
                  help="IPv6 address for the bridge (use none to turn off IPv6 or auto to generate a new random unused subnet) (CIDR)"
                />
              )}
              {formik.values.ipv6_address !== "none" && (
                <Select
                  {...getFormProps("ipv6_nat")}
                  label="IPv6 NAT"
                  help="Network address translation for IPv6"
                  options={optionEnableDisable}
                />
              )}
            </React.Fragment>
          )}
          {[BRIDGE, ADVANCED_OVN].includes(section) && (
            <>
              <Input
                {...getFormProps("bridge_mtu")}
                type="text"
                label="MTU"
                help="Bridge MTU (default varies if tunnel or fan setup)"
              />
              <Input
                {...getFormProps("bridge_hwaddr")}
                type="text"
                label="MAC address"
                help="MAC address for the bridge"
              />
              {formik.values.type.startsWith("bridge") && (
                <>
                  <Select
                    {...getFormProps("bridge_driver")}
                    label="Bridge Driver"
                    help="Bridge driver: native or openvswitch"
                    options={[
                      {
                        label: "Select option",
                        value: "",
                        disabled: true,
                      },
                      {
                        label: "Native",
                        value: "native",
                      },
                      {
                        label: "Openvswitch",
                        value: "openvswitch",
                      },
                    ]}
                  />
                  <Input
                    {...getFormProps("bridge_external_interfaces")}
                    type="text"
                    label="Bridge external interfaces"
                    help="Comma-separated list of unconfigured network interfaces to include in the bridge"
                  />
                  {formik.values.bridge_mode === "fan" && (
                    <>
                      <Select
                        {...getFormProps("fan_type")}
                        label="Fan type"
                        options={[
                          {
                            label: "Select option",
                            value: "",
                            disabled: true,
                          },
                          {
                            label: "vxlan",
                            value: "vxlan",
                          },
                          {
                            label: "ipip",
                            value: "ipip",
                          },
                        ]}
                      />
                      <Input
                        {...getFormProps("fan_overlay_subnet")}
                        type="text"
                        label="Fan overlay subnet"
                        help="Subnet to use as the overlay for the FAN (CIDR)"
                      />
                      <Input
                        {...getFormProps("fan_underlay_subnet")}
                        type="text"
                        label="Fan underlay subnet"
                        help="Subnet to use as the underlay for the FAN (use auto to use default gateway subnet) (CIDR)"
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}
          {[DNS, ADVANCED_OVN].includes(section) && (
            <>
              <Input
                {...getFormProps("dns_domain")}
                type="text"
                label="DNS domain"
                help="Domain to advertise to DHCP clients and use for DNS resolution"
              />
              {formik.values.type.startsWith("bridge") && (
                <Select
                  {...getFormProps("dns_mode")}
                  label="DNS mode"
                  help="DNS registration mode: none for no DNS record, managed for LXD-generated static records or dynamic for client-generated records"
                  options={[
                    {
                      label: "Select option",
                      value: "",
                      disabled: true,
                    },
                    {
                      label: "None",
                      value: "none",
                    },
                    {
                      label: "Managed",
                      value: "managed",
                    },
                    {
                      label: "Dynamic",
                      value: "dynamic",
                    },
                  ]}
                />
              )}
              <Input
                {...getFormProps("dns_search")}
                type="text"
                label="DNS search"
                help="Full comma-separated domain search list, defaulting to DNS domain value"
                disabled={formik.values.dns_mode === "none" || isReadOnly}
              />
            </>
          )}
          {[IPV4, ADVANCED_OVN].includes(section) && (
            <>
              {formik.values.ipv4_address !== "none" && (
                <Select
                  {...getFormProps("ipv4_dhcp")}
                  label="IPv4 DHCP"
                  help="Whether to allocate addresses using DHCP"
                  options={optionYesNo}
                />
              )}
              {formik.values.type !== "ovn" &&
                formik.values.ipv4_dhcp === "true" && (
                  <>
                    <Input
                      {...getFormProps("ipv4_dhcp_expiry")}
                      type="text"
                      label="IPv4 DHCP expiry"
                      help="When to expire DHCP leases"
                    />
                    <Input
                      {...getFormProps("ipv4_dhcp_gateway")}
                      type="text"
                      label="IPv4 DHCP gateway"
                      help="Address of the gateway for the subnet"
                    />
                    <Input
                      {...getFormProps("ipv4_dhcp_ranges")}
                      type="text"
                      label="IPv4 DHCP ranges"
                      help="Comma-separated list of IP ranges to use for DHCP (FIRST-LAST format)"
                    />
                  </>
                )}
              {formik.values.type === "ovn" && (
                <Select
                  {...getFormProps("ipv4_l3only")}
                  label="IPv4 L3 only"
                  help="Whether to enable layer 3 only mode."
                  options={optionYesNo}
                />
              )}
              {formik.values.type !== "ovn" &&
                formik.values.ipv4_address !== "none" && (
                  <Select
                    {...getFormProps("ipv4_firewall")}
                    label="IPv4 firewall"
                    help="Whether to generate filtering firewall rules for this network"
                    options={optionYesNo}
                  />
                )}
              {formik.values.ipv4_nat === "true" && (
                <>
                  <Input
                    {...getFormProps("ipv4_nat_address")}
                    type="text"
                    label="IPv4 NAT address"
                    help="The source address used for outbound traffic from the bridge"
                  />
                  {formik.values.type !== "ovn" && (
                    <Select
                      {...getFormProps("ipv4_nat_order")}
                      label="IPv4 NAT order"
                      help="Whether to add the required NAT rules before or after any pre-existing rules"
                      options={[
                        {
                          label: "Select option",
                          value: "",
                          disabled: true,
                        },
                        {
                          label: "Before",
                          value: "before",
                        },
                        {
                          label: "After",
                          value: "after",
                        },
                      ]}
                    />
                  )}
                </>
              )}
              {formik.values.type !== "ovn" &&
                formik.values.ipv4_address !== "none" && (
                  <>
                    <Input
                      {...getFormProps("ipv4_ovn_ranges")}
                      type="text"
                      label="IPv4 OVN ranges"
                      help="Comma-separated list of IPv4 ranges to use for child OVN network routers (FIRST-LAST format)"
                    />
                    <Input
                      {...getFormProps("ipv4_routes")}
                      type="text"
                      label="IPv4 routes"
                      help="Comma-separated list of additional IPv4 CIDR subnets to route to the bridge"
                    />
                    <Select
                      {...getFormProps("ipv4_routing")}
                      label="IPv4 routing"
                      help="Whether to route traffic in and out of the bridge"
                      options={optionYesNo}
                    />
                  </>
                )}
            </>
          )}
          {[IPV6, ADVANCED_OVN].includes(section) && (
            <>
              {formik.values.ipv6_address !== "none" && (
                <Select
                  {...getFormProps("ipv6_dhcp")}
                  label="IPv6 DHCP"
                  help="Whether to provide additional network configuration over DHCP"
                  options={optionYesNo}
                />
              )}
              {formik.values.ipv6_dhcp === "true" && (
                <>
                  {formik.values.type !== "ovn" && (
                    <>
                      <Input
                        {...getFormProps("ipv6_dhcp_expiry")}
                        type="text"
                        label="IPv6 DHCP expiry"
                        help="When to expire DHCP leases"
                      />
                      <Input
                        {...getFormProps("ipv6_dhcp_ranges")}
                        type="text"
                        label="IPv6 DHCP ranges"
                        help="Comma-separated list of IPv6 ranges to use for DHCP (FIRST-LAST format)"
                      />
                    </>
                  )}
                  <Select
                    {...getFormProps("ipv6_dhcp_stateful")}
                    label="IPv6 DHCP stateful"
                    help="Whether to allocate addresses using DHCP"
                    options={optionYesNo}
                  />
                </>
              )}
              {formik.values.type === "ovn" && (
                <Select
                  {...getFormProps("ipv6_l3only")}
                  label="IPv6 L3 only"
                  help="Whether to enable layer 3 only mode."
                  options={optionYesNo}
                />
              )}
              {formik.values.type !== "ovn" &&
                formik.values.ipv6_address !== "none" && (
                  <Select
                    {...getFormProps("ipv6_firewall")}
                    label="IPv6 firewall"
                    help="Whether to generate filtering firewall rules for this network"
                    options={optionYesNo}
                  />
                )}
              {formik.values.ipv6_nat === "true" && (
                <>
                  <Input
                    {...getFormProps("ipv6_nat_address")}
                    type="text"
                    label="IPv6 NAT address"
                    help="The source address used for outbound traffic from the bridge"
                  />
                  {formik.values.type !== "ovn" && (
                    <Select
                      {...getFormProps("ipv6_nat_order")}
                      label="IPv6 NAT order"
                      help="Whether to add the required NAT rules before or after any pre-existing rules"
                      options={[
                        {
                          label: "Select option",
                          value: "",
                          disabled: true,
                        },
                        {
                          label: "Before",
                          value: "before",
                        },
                        {
                          label: "After",
                          value: "after",
                        },
                      ]}
                    />
                  )}
                </>
              )}
              {formik.values.type !== "ovn" &&
                formik.values.ipv6_address === "none" && (
                  <>
                    <Input
                      {...getFormProps("ipv6_ovn_ranges")}
                      type="text"
                      label="IPv6 ovn ranges"
                      help="Comma-separated list of IPv6 ranges to use for child OVN network routers (FIRST-LAST format)"
                    />
                    <Input
                      {...getFormProps("ipv6_ovn_routes")}
                      type="text"
                      label="IPv6 ovn routes"
                      help="Comma-separated list of additional IPv6 CIDR subnets to route to the bridge"
                    />
                    <Select
                      {...getFormProps("ipv6_ovn_routing")}
                      label="IPv6 ovn routing"
                      options={optionYesNo}
                      help="Whether to route traffic in and out of the bridge"
                    />
                  </>
                )}
            </>
          )}
          {[USER, ADVANCED_OVN].includes(section) && (
            <>
              <Label>User-provided free-form key/value pairs</Label>
              {formik.values.user.map((userPair, index) => (
                <div key={index} className="user-key-values">
                  <Input
                    id={`user.${index}.key`}
                    name={`user.${index}.key`}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={userPair.key}
                    disabled={isReadOnly}
                    type="text"
                    placeholder="Enter key"
                    help={`Key ${index + 1}`}
                  />
                  <Input
                    id={`user.${index}.value`}
                    name={`user.${index}.value`}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={userPair.value}
                    disabled={isReadOnly}
                    type="text"
                    placeholder="Enter value"
                    help={`Value ${index + 1}`}
                  />
                  {!isReadOnly && (
                    <Button
                      aria-label={`remove user key and value ${index}`}
                      className="u-no-margin--bottom"
                      onClick={() => {
                        const copy = [...formik.values.user];
                        copy.splice(index, 1);
                        formik.setFieldValue("user", copy);
                      }}
                      type="button"
                      hasIcon
                    >
                      <Icon name="delete" />
                    </Button>
                  )}
                </div>
              ))}
              {!isReadOnly && (
                <div>
                  <Button
                    aria-label="add user key value pair"
                    onClick={() => {
                      const copy = [...formik.values.user];
                      copy.push({ key: "", value: "" });
                      formik.setFieldValue("user", copy);
                    }}
                    type="button"
                  >
                    <span>Add</span>
                  </Button>
                </div>
              )}
            </>
          )}

          {section === YAML_CONFIGURATION && (
            <YamlForm
              yaml={getYaml()}
              setYaml={(yaml) => formik.setFieldValue("yaml", yaml)}
              isReadOnly={isReadOnly}
            >
              <Notification severity="caution" title="Before you edit the YAML">
                Changes will be discarded, when switching back to the guided
                forms.
              </Notification>
            </YamlForm>
          )}
        </Col>
      </Row>
    </Form>
  );
};

export default NetworkForm;