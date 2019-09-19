## Modules

<dl>
<dt><a href="#module_zigbee-herdsman">zigbee-herdsman</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#Device">Device</a></dt>
<dd></dd>
<dt><a href="#Endpoint">Endpoint</a></dt>
<dd></dd>
<dt><a href="#Group">Group</a></dt>
<dd></dd>
<dt><a href="#Controller">Controller</a></dt>
<dd><p>Herdsman Controller Class</p></dd>
</dl>

<a name="module_zigbee-herdsman"></a>

## zigbee-herdsman
<a name="module_zigbee-herdsman.Controller"></a>

### zigbee-herdsman.Controller
**Kind**: static class of [<code>zigbee-herdsman</code>](#module_zigbee-herdsman)  
<a name="Device"></a>

## Device
**Kind**: global class  

* [Device](#Device)
    * _instance_
        * [.type](#Device+type)
        * [.ieeeAddr](#Device+ieeeAddr)
        * [.networkAddress](#Device+networkAddress)
        * [.manufacturerID](#Device+manufacturerID)
        * [.endpoints](#Device+endpoints)
        * [.manufacturerName](#Device+manufacturerName)
        * [.powerSource](#Device+powerSource)
        * [.modelID](#Device+modelID)
        * [.applicationVersion](#Device+applicationVersion)
        * [.stackVersion](#Device+stackVersion)
        * [.zclVersion](#Device+zclVersion)
        * [.hardwareVersion](#Device+hardwareVersion)
        * [.dateCode](#Device+dateCode)
        * [.softwareBuildID](#Device+softwareBuildID)
        * [.interviewCompleted](#Device+interviewCompleted)
        * [.interviewing](#Device+interviewing)
        * [.meta](#Device+meta)
        * [.lastSeen](#Device+lastSeen)
        * [.isType(type)](#Device+isType) ⇒ <code>boolean</code>
        * [.createEndpoint(ID)](#Device+createEndpoint) ⇒ <code>Promise</code>
        * [.getEndpoints()](#Device+getEndpoints) ⇒ [<code>Array.&lt;Endpoint&gt;</code>](#Endpoint)
        * [.getEndpoint(ID)](#Device+getEndpoint) ⇒ [<code>Endpoint</code>](#Endpoint)
        * [.get(key)](#Device+get) ⇒ <code>string</code> \| <code>number</code> \| <code>boolean</code>
        * [.set(key, value)](#Device+set) ⇒ <code>Promise</code>
        * [.removeFromNetwork()](#Device+removeFromNetwork) ⇒ <code>Promise</code>
        * [.removeFromDatabase()](#Device+removeFromDatabase) ⇒ <code>Promise</code>
        * [.lqi()](#Device+lqi) ⇒ <code>Promise</code>
        * [.routingTable()](#Device+routingTable) ⇒ <code>Promise</code>
        * [.ping()](#Device+ping) ⇒ <code>Promise</code>
    * _static_
        * [.findSingle(query)](#Device.findSingle) ⇒ <code>Promise</code>
        * [.find(query)](#Device.find) ⇒ <code>Promise</code>

<a name="Device+type"></a>

### device.type
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#type] | <code>DeviceType</code> | 

<a name="Device+ieeeAddr"></a>

### device.ieeeAddr
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| Device#ieeeAddr | <code>string</code> | 

<a name="Device+networkAddress"></a>

### device.networkAddress
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| Device#networkAddress | <code>number</code> | 

<a name="Device+manufacturerID"></a>

### device.manufacturerID
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#manufacturerID] | <code>number</code> | 

<a name="Device+endpoints"></a>

### device.endpoints
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| Device#endpoints | [<code>Array.&lt;Endpoint&gt;</code>](#Endpoint) | 

<a name="Device+manufacturerName"></a>

### device.manufacturerName
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#manufacturerName] | <code>string</code> | 

<a name="Device+powerSource"></a>

### device.powerSource
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#powerSource] | <code>string</code> | 

<a name="Device+modelID"></a>

### device.modelID
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#modelID] | <code>string</code> | 

<a name="Device+applicationVersion"></a>

### device.applicationVersion
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#applicationVersion] | <code>number</code> | 

<a name="Device+stackVersion"></a>

### device.stackVersion
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#stackVersion] | <code>number</code> | 

<a name="Device+zclVersion"></a>

### device.zclVersion
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#zclVersion] | <code>number</code> | 

<a name="Device+hardwareVersion"></a>

### device.hardwareVersion
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#hardwareVersion] | <code>number</code> | 

<a name="Device+dateCode"></a>

### device.dateCode
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#dateCode] | <code>string</code> | 

<a name="Device+softwareBuildID"></a>

### device.softwareBuildID
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| [Device#softwareBuildID] | <code>string</code> | 

<a name="Device+interviewCompleted"></a>

### device.interviewCompleted
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| Device#interviewCompleted | <code>boolean</code> | 

<a name="Device+interviewing"></a>

### device.interviewing
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| Device#interviewing | <code>boolean</code> | 

<a name="Device+meta"></a>

### device.meta
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| Device#meta | <code>Object</code> | <p>Can be used by applications to store data</p> |

<a name="Device+lastSeen"></a>

### device.lastSeen
**Kind**: instance property of [<code>Device</code>](#Device)  
**Properties**

| Name | Type |
| --- | --- |
| Device#lastSeen | <code>null</code> \| <code>number</code> | 

<a name="Device+isType"></a>

### device.isType(type) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>Device</code>](#Device)  
**Returns**: <code>boolean</code> - <ul>
<li>true if type is 'device'</li>
</ul>  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 

<a name="Device+createEndpoint"></a>

### device.createEndpoint(ID) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Device</code>](#Device)  
**Fulfil**: [<code>Endpoint</code>](#Endpoint)  

| Param | Type |
| --- | --- |
| ID | <code>number</code> | 

<a name="Device+getEndpoints"></a>

### device.getEndpoints() ⇒ [<code>Array.&lt;Endpoint&gt;</code>](#Endpoint)
**Kind**: instance method of [<code>Device</code>](#Device)  
<a name="Device+getEndpoint"></a>

### device.getEndpoint(ID) ⇒ [<code>Endpoint</code>](#Endpoint)
**Kind**: instance method of [<code>Device</code>](#Device)  

| Param | Type |
| --- | --- |
| ID | <code>number</code> | 

<a name="Device+get"></a>

### device.get(key) ⇒ <code>string</code> \| <code>number</code> \| <code>boolean</code>
**Kind**: instance method of [<code>Device</code>](#Device)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | <p>'modelID' | 'networkAddress' | 'interviewCompleted' | 'ieeeAddr' | 'interviewing'</p> |

<a name="Device+set"></a>

### device.set(key, value) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Device</code>](#Device)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | <p>'modelID' | 'networkAddress'</p> |
| value | <code>string</code> \| <code>number</code> |  |

<a name="Device+removeFromNetwork"></a>

### device.removeFromNetwork() ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Device</code>](#Device)  
<a name="Device+removeFromDatabase"></a>

### device.removeFromDatabase() ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Device</code>](#Device)  
<a name="Device+lqi"></a>

### device.lqi() ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Device</code>](#Device)  
**Fulfil**: <code>TsType.LQI</code>  
<a name="Device+routingTable"></a>

### device.routingTable() ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Device</code>](#Device)  
**Fulfil**: <code>TsType.RoutingTable</code> - The Routing Table  
<a name="Device+ping"></a>

### device.ping() ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Device</code>](#Device)  
<a name="Device.findSingle"></a>

### Device.findSingle(query) ⇒ <code>Promise</code>
**Kind**: static method of [<code>Device</code>](#Device)  

| Param | Type |
| --- | --- |
| query | <code>Object</code> | 
| [query.type] | <code>DeviceType</code> | 
| [query.ieeeAddr] | <code>string</code> | 
| [query.networkAddress] | <code>number</code> | 

<a name="Device.find"></a>

### Device.find(query) ⇒ <code>Promise</code>
**Kind**: static method of [<code>Device</code>](#Device)  
**Fulfil**: [<code>Device</code>](#Device)  

| Param | Type |
| --- | --- |
| query | <code>Object</code> | 
| [query.type] | <code>AdapterTsType.DeviceType</code> | 
| [query.ieeeAddr] | <code>string</code> | 
| [query.networkAddress] | <code>number</code> | 

<a name="Endpoint"></a>

## Endpoint
**Kind**: global class  

* [Endpoint](#Endpoint)
    * [.set(key, value)](#Endpoint+set) ⇒ <code>Promise</code>
    * [.get(key)](#Endpoint+get) ⇒ [<code>Endpoint</code>](#Endpoint)
    * [.supportsInputCluster(clusterKey)](#Endpoint+supportsInputCluster) ⇒ <code>boolean</code>
    * [.supportsOutputCluster(clusterKey)](#Endpoint+supportsOutputCluster) ⇒ <code>boolean</code>
    * [.write(clusterKey, attributes, [options])](#Endpoint+write) ⇒ <code>Promise</code>
    * [.read(clusterKey, attributes, [options])](#Endpoint+read) ⇒ <code>Promise</code>
    * [.bind(clusterKey, target)](#Endpoint+bind) ⇒ <code>Promise</code>
    * [.unbind(clusterKey, target)](#Endpoint+unbind) ⇒ <code>Promise</code>
    * [.configureReporting(clusterKey, items, [options])](#Endpoint+configureReporting)
    * [.command(clusterKey, commandKey, payload, [options])](#Endpoint+command)
    * [.addToGroup(group)](#Endpoint+addToGroup) ⇒ <code>Promise</code>
    * [.removeFromGroup(group)](#Endpoint+removeFromGroup) ⇒ <code>Promise</code>
    * [.removeFromAllGroups()](#Endpoint+removeFromAllGroups) ⇒ <code>Promise</code>

<a name="Endpoint+set"></a>

### endpoint.set(key, value) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | <p>'profileID' | 'deviceID' | 'inputClusters' | 'outputClusters'</p> |
| value | <code>number</code> \| <code>Array.&lt;number&gt;</code> |  |

<a name="Endpoint+get"></a>

### endpoint.get(key) ⇒ [<code>Endpoint</code>](#Endpoint)
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>number</code> \| <code>string</code> | <p>'ID' | 'deviceIeeeAddress'</p> |

<a name="Endpoint+supportsInputCluster"></a>

### endpoint.supportsInputCluster(clusterKey) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type |
| --- | --- |
| clusterKey | <code>number</code> \| <code>string</code> | 

<a name="Endpoint+supportsOutputCluster"></a>

### endpoint.supportsOutputCluster(clusterKey) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type |
| --- | --- |
| clusterKey | <code>number</code> \| <code>string</code> | 

<a name="Endpoint+write"></a>

### endpoint.write(clusterKey, attributes, [options]) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type |
| --- | --- |
| clusterKey | <code>number</code> \| <code>string</code> | 
| attributes | <code>KeyValue</code> | 
| [options] | <code>Options</code> | 

<a name="Endpoint+read"></a>

### endpoint.read(clusterKey, attributes, [options]) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  
**Fulfil**: <code>KeyValue</code>  

| Param | Type |
| --- | --- |
| clusterKey | <code>number</code> \| <code>string</code> | 
| attributes | <code>KeyValue</code> | 
| [options] | <code>Options</code> | 

<a name="Endpoint+bind"></a>

### endpoint.bind(clusterKey, target) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type |
| --- | --- |
| clusterKey | <code>number</code> \| <code>string</code> | 
| target | [<code>Endpoint</code>](#Endpoint) \| [<code>Group</code>](#Group) | 

<a name="Endpoint+unbind"></a>

### endpoint.unbind(clusterKey, target) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type |
| --- | --- |
| clusterKey | <code>number</code> \| <code>string</code> | 
| target | [<code>Endpoint</code>](#Endpoint) \| [<code>Group</code>](#Group) | 

<a name="Endpoint+configureReporting"></a>

### endpoint.configureReporting(clusterKey, items, [options])
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type |
| --- | --- |
| clusterKey | <code>number</code> \| <code>string</code> | 
| items | <code>Array.&lt;ConfigureReportingItem&gt;</code> | 
| [options] | <code>Options</code> | 

<a name="Endpoint+command"></a>

### endpoint.command(clusterKey, commandKey, payload, [options])
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type |
| --- | --- |
| clusterKey | <code>number</code> \| <code>string</code> | 
| commandKey | <code>number</code> | 
| payload | <code>KeyValue</code> | 
| [options] | <code>Options</code> | 

<a name="Endpoint+addToGroup"></a>

### endpoint.addToGroup(group) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type |
| --- | --- |
| group | [<code>Group</code>](#Group) | 

<a name="Endpoint+removeFromGroup"></a>

### endpoint.removeFromGroup(group) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type |
| --- | --- |
| group | [<code>Group</code>](#Group) | 

<a name="Endpoint+removeFromAllGroups"></a>

### endpoint.removeFromAllGroups() ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  
<a name="Group"></a>

## Group
**Kind**: global class  

* [Group](#Group)
    * _instance_
        * [.isType(type)](#Group+isType) ⇒ <code>boolean</code>
        * [.get(groupID)](#Group+get) ⇒ [<code>Group</code>](#Group)
        * [.removeFromDatabase()](#Group+removeFromDatabase) ⇒ <code>Promise</code>
        * [.save()](#Group+save) ⇒ <code>Promise</code>
        * [.addMember(endpoint)](#Group+addMember) ⇒ <code>Promise</code>
        * [.removeMember(endpoint)](#Group+removeMember) ⇒ <code>Promise</code>
        * [.hasMember(endpoint)](#Group+hasMember) ⇒ <code>boolean</code>
        * [.getMembers()](#Group+getMembers) ⇒ [<code>Array.&lt;Endpoint&gt;</code>](#Endpoint)
        * [.command(clusterKey, commandKey, payload)](#Group+command) ⇒ <code>Promise</code>
    * _static_
        * [.findSingle(query)](#Group.findSingle) ⇒ <code>Promise</code>
        * [.find(query)](#Group.find) ⇒ <code>Promise</code>
        * [.create(groupID)](#Group.create) ⇒ <code>Promise</code>

<a name="Group+isType"></a>

### group.isType(type) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>Group</code>](#Group)  
**Returns**: <code>boolean</code> - <p>true if type is 'group'</p>  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 

<a name="Group+get"></a>

### group.get(groupID) ⇒ [<code>Group</code>](#Group)
**Kind**: instance method of [<code>Group</code>](#Group)  

| Param | Type |
| --- | --- |
| groupID | <code>number</code> | 

<a name="Group+removeFromDatabase"></a>

### group.removeFromDatabase() ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Group</code>](#Group)  
<a name="Group+save"></a>

### group.save() ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Group</code>](#Group)  
<a name="Group+addMember"></a>

### group.addMember(endpoint) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Group</code>](#Group)  

| Param | Type |
| --- | --- |
| endpoint | [<code>Endpoint</code>](#Endpoint) | 

<a name="Group+removeMember"></a>

### group.removeMember(endpoint) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Group</code>](#Group)  

| Param | Type |
| --- | --- |
| endpoint | [<code>Endpoint</code>](#Endpoint) | 

<a name="Group+hasMember"></a>

### group.hasMember(endpoint) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>Group</code>](#Group)  

| Param | Type |
| --- | --- |
| endpoint | [<code>Endpoint</code>](#Endpoint) | 

<a name="Group+getMembers"></a>

### group.getMembers() ⇒ [<code>Array.&lt;Endpoint&gt;</code>](#Endpoint)
**Kind**: instance method of [<code>Group</code>](#Group)  
<a name="Group+command"></a>

### group.command(clusterKey, commandKey, payload) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Group</code>](#Group)  

| Param | Type |
| --- | --- |
| clusterKey | <code>number</code> \| <code>string</code> | 
| commandKey | <code>number</code> | 
| payload | <code>KeyValue</code> | 

<a name="Group.findSingle"></a>

### Group.findSingle(query) ⇒ <code>Promise</code>
**Kind**: static method of [<code>Group</code>](#Group)  
**Fulfil**: [<code>Group</code>](#Group)  

| Param | Type |
| --- | --- |
| query | <code>Object</code> | 
| query.groupID | <code>number</code> | 

<a name="Group.find"></a>

### Group.find(query) ⇒ <code>Promise</code>
**Kind**: static method of [<code>Group</code>](#Group)  
**Fulfil**: [<code>Group</code>](#Group)  

| Param | Type |
| --- | --- |
| query | <code>Object</code> | 
| [query.groupID] | <code>number</code> | 

<a name="Group.create"></a>

### Group.create(groupID) ⇒ <code>Promise</code>
**Kind**: static method of [<code>Group</code>](#Group)  
**Fulfil**: [<code>Group</code>](#Group)  

| Param | Type |
| --- | --- |
| groupID | <code>number</code> | 

<a name="Controller"></a>

## Controller
<p>Herdsman Controller Class</p>

**Kind**: global class  

* [Controller](#Controller)
    * [new Controller(options)](#new_Controller_new)
    * [.start()](#Controller+start) ⇒ <code>Promise</code>
    * [.permitJoin(permit)](#Controller+permitJoin) ⇒ <code>Promise</code>
    * [.softReset()](#Controller+softReset) ⇒ <code>Promise</code>
    * [.getCoordinatorVersion()](#Controller+getCoordinatorVersion) ⇒ <code>Promise</code>
    * [.getNetworkParameters()](#Controller+getNetworkParameters) ⇒ <code>Promise</code>
    * [.getDevices(query)](#Controller+getDevices) ⇒ <code>Promise</code>
    * [.getDevice(query)](#Controller+getDevice) ⇒ <code>Promise</code>
    * [.getGroup(query)](#Controller+getGroup) ⇒ <code>Promise</code>
    * [.getGroups(query)](#Controller+getGroups) ⇒ <code>Promise</code>
    * [.createGroup(groupID)](#Controller+createGroup) ⇒ <code>Promise</code>
    * [.disableLED()](#Controller+disableLED) ⇒ <code>Promise</code>
    * ["deviceAnnounce"](#Controller+event_deviceAnnounce)
    * ["deviceLeave"](#Controller+event_deviceLeave)
    * ["adapterDisconnected"](#Controller+event_adapterDisconnected)
    * ["deviceJoined"](#Controller+event_deviceJoined)
    * ["deviceInterview"](#Controller+event_deviceInterview)
    * ["message"](#Controller+event_message)

<a name="new_Controller_new"></a>

### new Controller(options)
<p>Create a controller</p>


| Param | Type | Default |
| --- | --- | --- |
| options | <code>Object</code> |  | 
| options.databasePath | <code>string</code> |  | 
| options.backupPath | <code>string</code> |  | 
| options.network | <code>Object</code> |  | 
| [options.network.networkKeyDistribute] | <code>boolean</code> | <code>false</code> | 
| [options.network.networkKey] | <code>Array.&lt;number&gt;</code> |  | 
| [options.network.panID] | <code>number</code> | <code>0x1a62</code> | 
| [options.network.channelList] | <code>Array.&lt;number&gt;</code> | <code>[11]</code> | 
| options.serialPort | <code>Object</code> |  | 
| [options.serialPort.baudRate] | <code>number</code> | <code>115200</code> | 
| [options.serialPort.rtscts] | <code>boolean</code> | <code>true</code> | 
| options.serialPort.path | <code>string</code> |  | 

<a name="Controller+start"></a>

### controller.start() ⇒ <code>Promise</code>
<p>Start the Herdsman controller</p>

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+permitJoin"></a>

### controller.permitJoin(permit) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type |
| --- | --- |
| permit | <code>boolean</code> | 

<a name="Controller+softReset"></a>

### controller.softReset() ⇒ <code>Promise</code>
<p>soft-reset the z-stack</p>

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+getCoordinatorVersion"></a>

### controller.getCoordinatorVersion() ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Fulfil**: <code>AdapterTsType.CoordinatorVersion</code>  
<a name="Controller+getNetworkParameters"></a>

### controller.getNetworkParameters() ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Fulfil**: <code>AdapterTsType.NetworkParameters</code>  
<a name="Controller+getDevices"></a>

### controller.getDevices(query) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Fulfil**: <code>Device[]</code>  

| Param | Type |
| --- | --- |
| query | <code>Object</code> | 
| [query.ieeeAddr] | <code>string</code> | 
| [query.type] | <code>AdapterTsType.DeviceType</code> | 

<a name="Controller+getDevice"></a>

### controller.getDevice(query) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Fulfil**: [<code>Device</code>](#Device)  

| Param | Type |
| --- | --- |
| query | <code>object</code> | 
| [query.ieeeAddr] | <code>string</code> | 
| [query.type] | <code>AdapterTsType.DeviceType</code> | 

<a name="Controller+getGroup"></a>

### controller.getGroup(query) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Fulfil**: [<code>Group</code>](#Group)  

| Param | Type |
| --- | --- |
| query | <code>Object</code> | 
| query.groupID | <code>number</code> | 

<a name="Controller+getGroups"></a>

### controller.getGroups(query) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Fulfil**: <code>Group[]</code>  

| Param | Type |
| --- | --- |
| query | <code>Object</code> | 
| query.groupID | <code>number</code> | 

<a name="Controller+createGroup"></a>

### controller.createGroup(groupID) ⇒ <code>Promise</code>
<p>Create a Group</p>

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Fulfil**: [<code>Group</code>](#Group)  

| Param | Type |
| --- | --- |
| groupID | <code>number</code> | 

<a name="Controller+disableLED"></a>

### controller.disableLED() ⇒ <code>Promise</code>
<p>Disable the LED</p>

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+event_deviceAnnounce"></a>

### "deviceAnnounce"
**Kind**: event emitted by [<code>Controller</code>](#Controller)  
**Properties**

| Name | Type |
| --- | --- |
| device | [<code>Device</code>](#Device) | 

<a name="Controller+event_deviceLeave"></a>

### "deviceLeave"
**Kind**: event emitted by [<code>Controller</code>](#Controller)  
<a name="Controller+event_adapterDisconnected"></a>

### "adapterDisconnected"
**Kind**: event emitted by [<code>Controller</code>](#Controller)  
<a name="Controller+event_deviceJoined"></a>

### "deviceJoined"
**Kind**: event emitted by [<code>Controller</code>](#Controller)  
<a name="Controller+event_deviceInterview"></a>

### "deviceInterview"
**Kind**: event emitted by [<code>Controller</code>](#Controller)  
<a name="Controller+event_message"></a>

### "message"
**Kind**: event emitted by [<code>Controller</code>](#Controller)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | <p>'attributeReport' | 'readResponse' | 'command*'</p> |
| device | [<code>Device</code>](#Device) |  |
| endpoint | [<code>Endpoint</code>](#Endpoint) |  |
| data | <code>Object</code> |  |
| linkquality | <code>number</code> |  |
| groupID | <code>number</code> |  |
| cluster | <code>string</code> |  |

