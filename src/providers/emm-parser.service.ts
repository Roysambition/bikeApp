import { Injectable } from '@angular/core';

export class TcmdModel {
  x: any;
  y: any;
  z: any;
  func: any;
  data: any;
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.func = null;
    this.data = null;
  }
}
@Injectable()
export class EmmParserService {

  /*
 *FS: dumpArray function not found
 * Data format
 * START func data[5:0] fcs END
 */
  START_CODE = 0xaa;
  END_CODE = 0x0d;
  NUM_BYTES = 10; // sync + func + data[5:0] + fcs + end
  EMM_COMMANDS = {
    DataIndexStart: 0,
    DataIndexEnd: 9,
    ProtoverSwverState: 10,
    SetMode: 11,
    ReadRegRaw: 12,
    WriteRegRaw: 13,
    Alive: 14,
  }

  constructor() { }

  init(rxState) {
    if(!rxState) rxState = {};
    rxState.rxbuf = new Uint8Array(this.NUM_BYTES);
    rxState.pos = 0;
    rxState.fcsErrorCount = 0;
  }

  pushByte(rxState, ch) {
    if (rxState.pos === 0) {
      /* Need the sync byte */
      if (ch != this.START_CODE) {
        return null;
      }
    }

    rxState.rxbuf[rxState.pos++] = ch;
    //dumpArray("--- pushByte Buffer ---", rxState.rxbuf, rxState.pos);

    if (rxState.pos >= this.NUM_BYTES) {
      /* We have received enough data.  It's time to check */
      var tcmd = this.rebuildCommand(rxState, rxState.rxbuf);


      if (tcmd === null) {
        this.reSync(rxState);
      } else
        rxState.pos = 0;

      return tcmd;
    }

    return null;

  }

  fmtCommand(cmdId, data) {
    var buf = new Uint8Array(this.NUM_BYTES);
    var txlen;
    txlen = this.frameGet(buf, cmdId, data);

    return buf;
  }

  /**
   * Rebuild the ACOMM_Cmd from the given buffer
   *
   * @return NULL if invalid.
   */
  private rebuildCommand(rxState, buf): TcmdModel {
    var fcs;

    if (buf[this.NUM_BYTES - 1] != this.END_CODE)
      return null;

    var part = buf.subarray(1, this.NUM_BYTES - 2);
    // console.log("Rebuilding command...")
    // console.log(buf);
    // console.log(part);

    fcs = this.getFCS(part, this.NUM_BYTES - 3);
    // console.log("fcs : " +fcs);
    // console.log("buf[7] : " +buf[7]);

    if (fcs != buf[this.NUM_BYTES - 2]) {
      rxState.fcsErrorCount++;
      return null;
    }

    var tcmd: TcmdModel = new TcmdModel();
    var val;

    val = this.combine16bitData(part[1], part[2]);
    tcmd.x = val;

    val = this.combine16bitData(part[3], part[4]);
    tcmd.y = val;

    val = this.combine16bitData(part[5], part[6]);
    tcmd.z = val;

    tcmd.func = part[0];
    tcmd.data = part.subarray(1, 7);

    // console.log("Got func: " +tcmd.func);
    // dumpArray("--- Rx Buffer ---", tcmd.data, 6);

    return tcmd;
  }

  private getFCS(buf, len) {
    var fcs = 0x45; // 'E'

    fcs ^= 0x56; // 'V'
    fcs ^= 0x53; // 'S'
    for (var pos = 0; pos < len; pos++) {
      fcs ^= buf[pos];
    }
    return (fcs & 0xff);
  }

  private combine16bitData(v1, v0) {
    // var v;

    // v = (v1 << 8) | v0;
    // return v;

    var v = new Int16Array(1);

    v[0] = (v1 << 8) | v0;
    return v[0];
  }


  /**
 * Sync again within the received bytes.
 *
 * @param rxbuf  Original received buffer, where candidate sync bytes may exist
 * @param ppos   Store the sync'd buffer position here
 */
  private reSync(rxState) {
    var i;
    var idx = -1;

    for (i = 1; i < this.NUM_BYTES; i++) {
      if (rxState.rxbuf[i] == this.START_CODE) {
        idx = i;
        break;
      }
    }

    if (idx > 0) {
      var j;

      i = 0;
      for (j = idx; j < this.NUM_BYTES; j++) {
        rxState.rxbuf[i++] = rxState.rxbuf[j];
      }
      rxState.pos = i;
    } else
      rxState.pos = 0;
  }

  private frameGet(txbuf, cmdId, data){
    if (typeof data === 'undefined')
    data = 0x0;

  var rawbuf = new Uint8Array(7);
  var pos = 0;

  rawbuf[pos++] = cmdId & 0xff;
  rawbuf[pos++] = data[0];
  rawbuf[pos++] = data[1];
  rawbuf[pos++] = data[2];
  rawbuf[pos++] = data[3];
  rawbuf[pos++] = data[4];
  rawbuf[pos++] = data[5];

  var fcs;
  fcs = this.getFCS(rawbuf, this.NUM_BYTES-3);

  txbuf[0] = this.START_CODE;
  for (var i = 0; i < (this.NUM_BYTES-3); i++) {
    txbuf[1+i] = rawbuf[i];
  }

  txbuf[this.NUM_BYTES-2] = fcs;
  txbuf[this.NUM_BYTES-1] = this.END_CODE;

  // dumpArray("--- Tx Buffer ---", txbuf, NUM_BYTES);
  return this.NUM_BYTES;
  }
}
