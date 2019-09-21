import {
  ComplexArray, DataArray, RealArray, 
  Int, Pointer,
  KissFFTConfig
} from "./types"

import { wasm } from "./wasm"

export function checkRealFFT(nfft: Int) {
  if (nfft % 2 === 1) {
    throw new Error("Real FFT optimization must be even.")
  }
}

abstract class AbstractRealFFTConfig<T extends DataArray, K extends DataArray> extends KissFFTConfig<T, K> {
  protected ptr: Pointer<this> = 0

  constructor(
    nfft: Int,
    inverse: boolean
  ) {
    super(nfft, inverse)
    checkRealFFT(nfft)
    this.ptr = wasm._kiss_fftr_alloc(nfft, inverse, 0, 0)
  }

  public get pointer(): Pointer<this> {
    return this.ptr
  }

  public free() {
    wasm._free(this.ptr)
    this.ptr = 0
  }
}

export class RealFFTConfig extends AbstractRealFFTConfig<RealArray, ComplexArray> {
  constructor(nfft: Int) {
    super(nfft, false)
  }

  public work(input: RealArray, output: ComplexArray) {
    this.check(input, output)
    wasm._kiss_fftr(this.ptr, input.pointer, output.pointer)
  }
}

export class InverseRealFFTConfig extends AbstractRealFFTConfig<ComplexArray, RealArray> {
  constructor(nfft: Int) {
    super(nfft, true)
  }

  public work(input: ComplexArray, output: RealArray) {
    this.check(input, output)
    wasm._kiss_fftri(this.ptr, input.pointer, output.pointer)
    wasm._scale(output.pointer, this.nfft, 1.0 / this.nfft) 
  }
}
